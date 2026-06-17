const Trip = require('../models/travlr');
const TripSearchService = require('../services/tripSearchService');

// The controller keeps request-body whitelisting close to the write endpoints
// so persistence rules remain visible without coupling them to search logic.
// The whitelist is fixed-size, making request shaping O(1) regardless of how
// many unexpected fields a client includes.
const sanitizeTripInput = (body) => ({
  code: body.code,
  name: body.name,
  length: body.length,
  start: body.start,
  resort: body.resort,
  perPerson: body.perPerson,
  image: body.image,
  description: body.description
});

/**
 * GET /api/trips
 * The controller deliberately delegates ranking and pagination to
 * TripSearchService so this layer stays focused on HTTP concerns. MongoDB still
 * receives the first-pass filter to reduce memory work before the service runs
 * application-level scoring on fields currently stored as display strings. With
 * indexed filters, database narrowing approaches O(log n + r) for n trips and r
 * matches; only r records then enter the service's O(r log r) scoring/sort path.
 */
const tripsList = async (req, res, next) => {
  try {
    const searchEnabled = TripSearchService.hasSearchCriteria(req.query);
    const mongoFilter = searchEnabled ? TripSearchService.buildMongoFilter(req.query) : {};
    const trips = await Trip.find(mongoFilter).lean().exec();

    if (!trips || trips.length === 0) {
      return res.status(404).json({
        message: 'No trips found'
      });
    }

    if (!searchEnabled) {
      // Preserve the original API contract for the Angular admin list, which
      // expects a plain array when no search criteria are submitted.
      return res.status(200).json(trips);
    }

    return res.status(200).json(
      TripSearchService.buildSearchResults(trips, req.query)
    );
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/trips/:tripcode
 * Uses lean reads because the API only serializes the result; avoiding full
 * Mongoose document hydration lowers constant overhead. The indexed code lookup
 * avoids an O(n) collection scan and targets O(log n) lookup behavior.
 */
const tripsFindByCode = async (req, res, next) => {
  try {
    const trip = await Trip.findOne({
      code: req.params.tripcode
    }).lean().exec();

    if (!trip) {
      return res.status(404).json({
        message: 'Trip not found'
      });
    }

    return res.status(200).json(trip);
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /api/trips
 * Creates a new trip from a whitelisted payload. This prevents clients from
 * persisting unexpected fields while keeping schema validation in the model.
 */
const tripAddTrip = async (req, res, next) => {
  try {
    const newTrip = new Trip(sanitizeTripInput(req.body));
    const savedTrip = await newTrip.save();

    if (!savedTrip) {
      return res.status(400).json({
        message: 'Error creating trip'
      });
    }

    return res.status(201).json(savedTrip);
  } catch (err) {
    return next(err);
  }
};

/**
 * PUT /api/trips/:tripcode
 * Runs model validators during updates so the API does not bypass schema rules
 * when using findOneAndUpdate for a single indexed lookup and write. Targeting
 * the unique code index keeps selection near O(log n) instead of scanning trips.
 */
const tripsUpdateTrip = async (req, res, next) => {
  try {
    const updatedTrip = await Trip.findOneAndUpdate(
      { code: req.params.tripcode },
      sanitizeTripInput(req.body),
      {
        new: true,
        runValidators: true
      }
    ).exec();

    if (!updatedTrip) {
      return res.status(404).json({
        message: 'Trip not found'
      });
    }

    return res.status(200).json(updatedTrip);
  } catch (err) {
    return next(err);
  }
};

/**
 * DELETE /api/trips/:tripcode
 * Performs a direct delete for the current CRUD scope. A future audit workflow
 * would replace this with a soft-delete service without changing route wiring.
 * The unique code constraint keeps delete targeting near O(log n) by avoiding
 * ambiguous multi-record matches.
 */
const tripsDeleteTrip = async (req, res, next) => {
  try {
    const deletedTrip = await Trip.findOneAndDelete({
      code: req.params.tripcode
    }).exec();

    if (!deletedTrip) {
      return res.status(404).json({
        message: 'Trip not found'
      });
    }

    return res.status(200).json({
      message: 'Trip deleted successfully',
      deletedTrip
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  tripsList,
  tripsFindByCode,
  tripAddTrip,
  tripsUpdateTrip,
  tripsDeleteTrip
};
