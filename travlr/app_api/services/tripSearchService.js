// Weighted scoring is stored in an immutable lookup object so ranking policy is
// explicit, tunable, and independent from the controller that serves HTTP.
const SCORE_WEIGHTS = Object.freeze({
  exactCodeMatch: 50,
  nameMatch: 35,
  resortMatch: 30,
  descriptionMatch: 20,
  priceMatch: 20,
  lengthMatch: 15,
  upcomingTrip: 10
});

// A fixed allowlist prevents arbitrary query values from changing sort behavior
// and keeps the search contract predictable for the Angular dashboard.
const ALLOWED_SORT_OPTIONS = Object.freeze([
  'relevance',
  'price-low',
  'price-high',
  'length-short',
  'length-long',
  'start-date',
  'name'
]);

// This service isolates the recommendation/search engine from Express. The
// public static methods are the small integration surface used by controllers;
// private methods hide parsing, scoring, and pagination details that should not
// be called directly from routing or UI code.
class TripSearchService {
  static hasSearchCriteria(query) {
    const searchableFields = [
      'keyword',
      'code',
      'resort',
      'minPrice',
      'maxPrice',
      'minLength',
      'maxLength',
      'sortBy'
    ];

    return searchableFields.some((field) => query[field] !== undefined && query[field] !== '');
  }

  static buildMongoFilter(query) {
    const filter = {};
    const keyword = TripSearchService.#normalizeText(query.keyword);
    const resort = TripSearchService.#normalizeText(query.resort);
    const code = TripSearchService.#normalizeText(query.code);

    if (keyword) {
      // MongoDB handles broad text narrowing first, reducing the number of
      // records the Node process must score and paginate in memory.
      const keywordRegex = TripSearchService.#buildSafeRegex(keyword);

      filter.$or = [
        { code: keywordRegex },
        { name: keywordRegex },
        { resort: keywordRegex },
        { description: keywordRegex }
      ];
    }

    if (resort) {
      filter.resort = TripSearchService.#buildSafeRegex(resort);
    }

    if (code) {
      filter.code = TripSearchService.#buildSafeRegex(code);
    }

    return filter;
  }

  static buildSearchResults(trips, query) {
    const preferences = TripSearchService.#buildSearchPreferences(query);
    const filteredTrips = TripSearchService.#filterTripsByNumericCriteria(trips, preferences);

    // The map/filter/sort pipeline favors readable, deterministic ranking over
    // premature optimization. Pagination limits the response size after scoring
    // so the most relevant records are retained before slicing.
    const scoredTrips = filteredTrips.map((trip) => ({
      ...trip,
      recommendationScore: TripSearchService.#calculateTripScore(trip, preferences)
    }));

    const sortedTrips = TripSearchService.#sortTrips(scoredTrips, preferences.sortBy);
    const paginatedTrips = TripSearchService.#paginateTrips(
      sortedTrips,
      preferences.page,
      preferences.limit
    );

    return {
      count: paginatedTrips.length,
      totalMatches: sortedTrips.length,
      page: preferences.page,
      limit: preferences.limit,
      sortBy: preferences.sortBy,
      results: paginatedTrips
    };
  }

  static #buildSearchPreferences(query) {
    const sortBy = TripSearchService.#normalizeText(query.sortBy || 'relevance');

    if (!ALLOWED_SORT_OPTIONS.includes(sortBy)) {
      throw TripSearchService.#createValidationError(`Unsupported sort option: ${sortBy}`);
    }

    return {
      keyword: TripSearchService.#normalizeText(query.keyword),
      code: TripSearchService.#normalizeText(query.code),
      resort: TripSearchService.#normalizeText(query.resort),
      minPrice: TripSearchService.#parseOptionalNumber(query.minPrice, 'minPrice'),
      maxPrice: TripSearchService.#parseOptionalNumber(query.maxPrice, 'maxPrice'),
      minLength: TripSearchService.#parseOptionalNumber(query.minLength, 'minLength'),
      maxLength: TripSearchService.#parseOptionalNumber(query.maxLength, 'maxLength'),
      sortBy,
      page: TripSearchService.#parsePositiveInteger(query.page, 'page', 1),
      limit: Math.min(TripSearchService.#parsePositiveInteger(query.limit, 'limit', 20), 100)
    };
  }

  static #calculateTripScore(trip, preferences) {
    let score = 0;

    // Trip values are normalized once per record so every scoring rule compares
    // against the same representation and avoids repeated string conversions.
    const tripContext = {
      code: TripSearchService.#normalizeText(trip.code),
      name: TripSearchService.#normalizeText(trip.name),
      resort: TripSearchService.#normalizeText(trip.resort),
      description: TripSearchService.#normalizeText(trip.description),
      price: TripSearchService.#parseCurrencyValue(trip.perPerson),
      lengthDays: TripSearchService.#parseTripLengthDays(trip.length),
      startDate: trip.start ? new Date(trip.start) : null
    };

    if (preferences.code && tripContext.code === preferences.code) {
      score += SCORE_WEIGHTS.exactCodeMatch;
    }

    if (preferences.keyword) {
      if (tripContext.name.includes(preferences.keyword)) {
        score += SCORE_WEIGHTS.nameMatch;
      }

      if (tripContext.resort.includes(preferences.keyword)) {
        score += SCORE_WEIGHTS.resortMatch;
      }

      if (tripContext.description.includes(preferences.keyword)) {
        score += SCORE_WEIGHTS.descriptionMatch;
      }

      if (tripContext.code.includes(preferences.keyword)) {
        score += SCORE_WEIGHTS.exactCodeMatch / 2;
      }
    }

    if (preferences.resort && tripContext.resort.includes(preferences.resort)) {
      score += SCORE_WEIGHTS.resortMatch;
    }

    if (preferences.minPrice || preferences.maxPrice) {
      const aboveMinimum = !preferences.minPrice || tripContext.price >= preferences.minPrice;
      const belowMaximum = !preferences.maxPrice || tripContext.price <= preferences.maxPrice;

      if (aboveMinimum && belowMaximum) {
        score += SCORE_WEIGHTS.priceMatch;
      }
    }

    if (preferences.minLength || preferences.maxLength) {
      const aboveMinimum = !preferences.minLength || tripContext.lengthDays >= preferences.minLength;
      const belowMaximum = !preferences.maxLength || tripContext.lengthDays <= preferences.maxLength;

      if (aboveMinimum && belowMaximum) {
        score += SCORE_WEIGHTS.lengthMatch;
      }
    }

    if (tripContext.startDate && tripContext.startDate >= new Date()) {
      score += SCORE_WEIGHTS.upcomingTrip;
    }

    return score;
  }

  static #filterTripsByNumericCriteria(trips, preferences) {
    return trips.filter((trip) => {
      // Price and length are stored as display strings in the current schema, so
      // numeric filtering stays in this service until the database model can be
      // migrated to numeric fields.
      const price = TripSearchService.#parseCurrencyValue(trip.perPerson);
      const lengthDays = TripSearchService.#parseTripLengthDays(trip.length);

      if (preferences.minPrice && price < preferences.minPrice) {
        return false;
      }

      if (preferences.maxPrice && price > preferences.maxPrice) {
        return false;
      }

      if (preferences.minLength && lengthDays < preferences.minLength) {
        return false;
      }

      if (preferences.maxLength && lengthDays > preferences.maxLength) {
        return false;
      }

      return true;
    });
  }

  static #sortTrips(trips, sortBy) {
    // Sorting a copy avoids mutating the caller's array, which keeps this
    // service safe to reuse in tests or additional endpoints.
    const sortedTrips = [...trips];

    switch (sortBy) {
      case 'price-low':
        return sortedTrips.sort((a, b) => (
          TripSearchService.#parseCurrencyValue(a.perPerson)
          - TripSearchService.#parseCurrencyValue(b.perPerson)
        ));

      case 'price-high':
        return sortedTrips.sort((a, b) => (
          TripSearchService.#parseCurrencyValue(b.perPerson)
          - TripSearchService.#parseCurrencyValue(a.perPerson)
        ));

      case 'length-short':
        return sortedTrips.sort((a, b) => (
          TripSearchService.#parseTripLengthDays(a.length)
          - TripSearchService.#parseTripLengthDays(b.length)
        ));

      case 'length-long':
        return sortedTrips.sort((a, b) => (
          TripSearchService.#parseTripLengthDays(b.length)
          - TripSearchService.#parseTripLengthDays(a.length)
        ));

      case 'start-date':
        return sortedTrips.sort((a, b) => new Date(a.start) - new Date(b.start));

      case 'name':
        return sortedTrips.sort((a, b) => (
          TripSearchService.#normalizeText(a.name).localeCompare(
            TripSearchService.#normalizeText(b.name)
          )
        ));

      case 'relevance':
      default:
        return sortedTrips.sort((a, b) => b.recommendationScore - a.recommendationScore);
    }
  }

  static #paginateTrips(trips, page, limit) {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return trips.slice(startIndex, endIndex);
  }

  static #normalizeText(value) {
    return String(value || '').trim().toLowerCase();
  }

  static #parseCurrencyValue(value) {
    if (value === null || value === undefined) {
      return 0;
    }

    const numericValue = Number(String(value).replace(/[^0-9.]/g, ''));
    return Number.isFinite(numericValue) ? numericValue : 0;
  }

  static #parseTripLengthDays(value) {
    if (value === null || value === undefined) {
      return 0;
    }

    const match = String(value).match(/\d+/);
    return match ? Number(match[0]) : 0;
  }

  static #parseOptionalNumber(value, fieldName) {
    if (value === undefined || value === '') {
      return null;
    }

    const parsedValue = Number(value);

    if (!Number.isFinite(parsedValue)) {
      throw TripSearchService.#createValidationError(`${fieldName} must be a number`);
    }

    return parsedValue;
  }

  static #parsePositiveInteger(value, fieldName, defaultValue) {
    if (value === undefined || value === '') {
      return defaultValue;
    }

    const parsedValue = Number(value);

    if (!Number.isInteger(parsedValue) || parsedValue < 1) {
      throw TripSearchService.#createValidationError(`${fieldName} must be a positive integer`);
    }

    return parsedValue;
  }

  static #buildSafeRegex(value) {
    // Escaping user input preserves flexible partial matching without allowing
    // callers to inject expensive or unintended regular expression patterns.
    const escapedValue = String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(escapedValue, 'i');
  }

  static #createValidationError(message) {
    const error = new Error(message);
    error.status = 400;
    return error;
  }
}

module.exports = TripSearchService;
