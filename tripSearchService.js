/*
 * Artifact: tripSearchService.js
 * Category: Algorithms and Data Structures
 *
 * Purpose:
 * This service contains the trip search and recommendation logic for the Travlr
 * Getaways application. It separates algorithmic processing from the Express
 * controller so the controller can focus on HTTP request/response behavior,
 * while this service handles search criteria, filtering, scoring, sorting,
 * pagination, and validation.
 *
 * Course Outcome Alignment:
 *
 * Outcome 3:
 * Design and evaluate computing solutions that solve a given problem using
 * algorithmic principles and computer science practices while managing trade-offs.
 *
 * This artifact supports Outcome 3 because it applies algorithmic techniques
 * such as filtering, weighted scoring, sorting, and pagination to improve how
 * users search for trips. It also demonstrates trade-off awareness by combining
 * database-level filtering with application-level scoring. MongoDB narrows the
 * result set first, and this service then ranks and paginates the remaining data.
 *
 * Outcome 4:
 * Demonstrate the use of well-founded and innovative techniques, skills, and
 * tools in computing practices to implement solutions that deliver value.
 *
 * This artifact supports Outcome 4 because it uses JavaScript, Node.js,
 * service-layer architecture, query validation, and recommendation-style scoring
 * to make the Travlr application more useful and professional.
 *
 * Outcome 5:
 * Develop a security mindset that anticipates adversarial exploits and mitigates
 * design flaws.
 *
 * This artifact partially supports Outcome 5 because it validates incoming
 * query parameters, restricts accepted sort options, and escapes user input
 * before creating regular expressions. This reduces the risk of unexpected query
 * behavior or unsafe regular expression patterns.
 *
 * Big O Summary:
 *
 * Let n represent the number of trip records passed into this service.
 *
 * - Checking for search criteria is O(1) because it checks a fixed list of fields.
 * - Building preferences is O(1) because it parses a fixed set of query parameters.
 * - Filtering trips is O(n) because each trip may be checked once.
 * - Scoring trips is O(n) because each filtered trip receives one score.
 * - Sorting trips is O(n log n), which is typical for comparison-based sorting.
 * - Pagination is O(k), where k is the page size, because only a slice of results
 *   is returned.
 *
 * Overall, the dominant cost is sorting, so the service is generally O(n log n)
 * after MongoDB returns the matching records.
 */

// Weighted scoring is stored in an immutable lookup object so the ranking rules
// are explicit, easy to adjust, and separated from the controller. This supports
// maintainability because future scoring changes can be made here without
// rewriting the search algorithm or API route logic.
const SCORE_WEIGHTS = Object.freeze({
  exactCodeMatch: 50,
  nameMatch: 35,
  resortMatch: 30,
  descriptionMatch: 20,
  priceMatch: 20,
  lengthMatch: 15,
  upcomingTrip: 10
});

// A fixed allowlist prevents arbitrary query values from controlling sort
// behavior. This improves predictability and supports secure design because
// users can only request approved sort operations.
//
// Big O: O(1)
// This list is fixed in size, so checking whether a sort option is allowed does
// not grow meaningfully as the number of trips grows.
const ALLOWED_SORT_OPTIONS = Object.freeze([
  'relevance',
  'price-low',
  'price-high',
  'length-short',
  'length-long',
  'start-date',
  'name'
]);

// This service isolates the search and recommendation engine from Express.
// The public static methods create a small integration surface for controllers,
// while private methods hide the internal parsing, scoring, sorting, and
// pagination details. This demonstrates separation of concerns, which improves
// testability and maintainability.
class TripSearchService {
  /*
   * Determines whether the request includes any search-related query parameters.
   *
   * Big O: O(1)
   * The method checks a fixed number of searchable fields. Since the number of
   * fields does not increase with the number of trips, the runtime is constant.
   */
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

  /*
   * Builds a MongoDB filter from user search input.
   *
   * This allows MongoDB to narrow the trip records before the application
   * performs in-memory scoring and sorting. That is a useful trade-off because
   * database filtering can reduce the number of records this service has to
   * process.
   *
   * Big O: O(1) for building the filter object.
   * The actual database query performance depends on MongoDB indexes and the
   * number of matching records. With helpful indexes, the database can reduce
   * the number of records passed into the application.
   */
  static buildMongoFilter(query) {
    const filter = {};
    const keyword = TripSearchService.#normalizeText(query.keyword);
    const resort = TripSearchService.#normalizeText(query.resort);
    const code = TripSearchService.#normalizeText(query.code);

    if (keyword) {
      // Escaped regular expressions support flexible partial matching while
      // reducing the risk of unsafe or expensive regex patterns from user input.
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

  /*
   * Builds the final enhanced search response.
   *
   * This method performs the main algorithmic pipeline:
   * 1. Build normalized search preferences.
   * 2. Filter trips by numeric criteria.
   * 3. Score each remaining trip.
   * 4. Sort the scored trips.
   * 5. Paginate the sorted results.
   *
   * Big O:
   * - Filtering: O(n)
   * - Scoring with map: O(n)
   * - Sorting: O(n log n)
   * - Pagination: O(k), where k is the page size
   *
   * Overall: O(n log n), because sorting is the dominant operation.
   */
  static buildSearchResults(trips, query) {
    const preferences = TripSearchService.#buildSearchPreferences(query);
    const filteredTrips = TripSearchService.#filterTripsByNumericCriteria(trips, preferences);

    // Each filtered trip is copied and given a recommendationScore. This keeps
    // the original trip data intact while adding a calculated ranking value for
    // the response.
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

  /*
   * Converts raw query parameters into normalized and validated search preferences.
   *
   * This method protects the rest of the algorithm from raw user input by
   * validating numbers, applying defaults, enforcing positive page values, and
   * limiting the maximum page size.
   *
   * Big O: O(1)
   * The number of query parameters being parsed is fixed.
   */
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

      // The limit is capped at 100 so clients cannot request an excessively
      // large response. This supports performance and basic defensive design.
      limit: Math.min(TripSearchService.#parsePositiveInteger(query.limit, 'limit', 20), 100)
    };
  }

  /*
   * Calculates a recommendation score for one trip based on the user's search
   * preferences.
   *
   * A higher score means the trip is more relevant to the user's search. The
   * score is based on code matches, keyword matches, resort matches, price range,
   * trip length range, and whether the trip is upcoming.
   *
   * Big O: O(1) per trip
   * The method checks a fixed number of fields for each trip. When applied to
   * all trips, scoring becomes O(n).
   */
  static #calculateTripScore(trip, preferences) {
    let score = 0;

    // Trip values are normalized once per record so each scoring rule compares
    // against consistent lowercase, trimmed values. This reduces missed matches
    // caused by inconsistent capitalization or extra spaces.
    const tripContext = {
      code: TripSearchService.#normalizeText(trip.code),
      name: TripSearchService.#normalizeText(trip.name),
      resort: TripSearchService.#normalizeText(trip.resort),
      description: TripSearchService.#normalizeText(trip.description),

      // These parser helpers convert display-friendly values into numeric values
      // so the algorithm can compare price and trip duration.
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

  /*
   * Removes trips that do not meet numeric price or length criteria.
   *
   * This is needed because the current database schema stores price and length
   * as display strings. Until the schema is fully migrated to numeric fields,
   * this service converts those strings into comparable numbers.
   *
   * Big O: O(n)
   * Each trip is checked once.
   */
  static #filterTripsByNumericCriteria(trips, preferences) {
    return trips.filter((trip) => {
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

  /*
   * Sorts trips according to the selected sort option.
   *
   * A copy of the array is sorted so the original input array is not mutated.
   * This makes the service safer to reuse in tests or future endpoints.
   *
   * Big O: O(n log n)
   * JavaScript's array sort is comparison-based, so sorting is usually the most
   * expensive step in this service.
   */
  static #sortTrips(trips, sortBy) {
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

  /*
   * Returns only the trips for the requested page.
   *
   * Big O: O(k)
   * k is the number of records included in the requested page. Because the limit
   * is capped, this helps control response size and supports scalability.
   */
  static #paginateTrips(trips, page, limit) {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return trips.slice(startIndex, endIndex);
  }

  /*
   * Normalizes text for consistent comparisons.
   *
   * This prevents searches from failing because of capitalization differences
   * or extra spaces.
   *
   * Big O: O(m)
   * m is the length of the string being normalized. For practical search fields,
   * this is small and treated as constant relative to the number of trips.
   */
  static #normalizeText(value) {
    return String(value || '').trim().toLowerCase();
  }

  /*
   * Converts a display-friendly currency value into a number.
   *
   * Example:
   * "$1,299" becomes 1299.
   *
   * This allows the algorithm to compare prices even while the database still
   * stores price as a display string.
   *
   * Big O: O(m)
   * m is the length of the currency string.
   */
  static #parseCurrencyValue(value) {
    if (value === null || value === undefined) {
      return 0;
    }

    const numericValue = Number(String(value).replace(/[^0-9.]/g, ''));
    return Number.isFinite(numericValue) ? numericValue : 0;
  }

  /*
   * Extracts the numeric number of days from a display string.
   *
   * Example:
   * "7 days" becomes 7.
   *
   * This supports duration filtering until the database schema is fully migrated
   * to a numeric lengthDays field.
   *
   * Big O: O(m)
   * m is the length of the trip length string.
   */
  static #parseTripLengthDays(value) {
    if (value === null || value === undefined) {
      return 0;
    }

    const match = String(value).match(/\d+/);
    return match ? Number(match[0]) : 0;
  }

  /*
   * Parses an optional numeric query parameter.
   *
   * This method validates that numeric filters are actually numbers before the
   * algorithm uses them. Invalid values become controlled 400-level validation
   * errors instead of unpredictable application behavior.
   *
   * Big O: O(1)
   */
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

  /*
   * Parses a positive integer query parameter such as page or limit.
   *
   * This prevents invalid pagination values like negative numbers, decimals, or
   * text strings.
   *
   * Big O: O(1)
   */
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

  /*
   * Escapes user input before building a regular expression.
   *
   * This preserves flexible partial matching while preventing users from
   * injecting unintended regular expression syntax. It supports a security
   * mindset by reducing the risk of unsafe or expensive regex behavior.
   *
   * Big O: O(m)
   * m is the length of the search string.
   */
  static #buildSafeRegex(value) {
    const escapedValue = String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(escapedValue, 'i');
  }

  /*
   * Creates a consistent validation error object.
   *
   * The controller can pass this error to centralized error handling and return
   * a clean 400 response to the client.
   *
   * Big O: O(1)
   */
  static #createValidationError(message) {
    const error = new Error(message);
    error.status = 400;
    return error;
  }
}

module.exports = TripSearchService;