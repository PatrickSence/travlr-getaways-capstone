/*
 * Artifact: trips.js
 * Category: Algorithms and Data Structures
 *
 * Purpose:
 * This controller manages the trip API endpoints for the Travlr Getaways
 * application. It handles HTTP request and response behavior for listing,
 * finding, creating, updating, and deleting trips.
 *
 * Enhancement Summary:
 * The controller was enhanced to delegate advanced search, filtering,
 * recommendation scoring, sorting, and pagination to TripSearchService. This
 * improves separation of concerns because the controller remains focused on API
 * behavior while the service layer handles algorithmic processing.
 *
 * Course Outcome Alignment:
 *
 * Outcome 3:
 * This artifact supports Outcome 3 because it demonstrates the design and
 * evaluation of a computing solution using computer science principles. The
 * controller manages trade-offs between backward compatibility, database
 * filtering, service-layer processing, and API response design.
 *
 * Outcome 4:
 * This artifact supports Outcome 4 because it uses modern full-stack practices,
 * including Express controllers, Mongoose queries, service-layer architecture,
 * lean database reads, request validation, and RESTful API design to deliver
 * practical application value.
 *
 * Outcome 5:
 * This artifact partially supports Outcome 5 because request-body whitelisting
 * helps protect the database from unexpected client-provided fields. It also
 * prepares the API for stronger authorization rules, such as limiting trip
 * creation, updates, and deletion to admin users.
 *
 * Big O Summary:
 *
 * - Request-body whitelisting is O(1) because the controller copies a fixed
 *   number of approved fields.
 * - Finding a trip by indexed code targets O(log n) database lookup behavior,
 *   where n is the number of trips.
 * - Listing trips with search criteria first narrows results through MongoDB,
 *   then passes only the matching records to TripSearchService.
 * - The service layer performs filtering and scoring in O(r), then sorting in
 *   O(r log r), where r is the number of matching records returned by MongoDB.
 */

const Trip = require('../models/travlr');

// The controller imports TripSearchService so algorithmic search and ranking
// logic stays outside the Express route handler. This separation of concerns
// supports Outcome 3 because it demonstrates intentional software design and
// trade-off management. The controller handles HTTP behavior, while the service
// handles filtering, scoring, sorting, and pagination.
//
// This also supports Outcome 4 because service-layer design is a common
// professional development practice that makes the application easier to test,
// maintain, and extend.
//
// Big O:
// The controller itself does not perform the full scoring algorithm. It allows
// MongoDB to narrow the result set first, then sends only the matching records
// to the service. If r records match the database filter, the service works on
// r records instead of always processing the full collection of n trips.
const TripSearchService = require('../services/tripSearchService');

// The controller keeps request-body whitelisting close to the write endpoints
// so persistence rules remain visible without coupling them to search logic.
//
// Outcome 5:
// This supports a security mindset by preventing clients from saving unexpected
// fields through POST or PUT requests. Even if a client submits extra properties,
// only the approved trip fields are passed into the Mongoose model.
//
// Outcome 3:
// This also demonstrates trade-off management because the controller allows
// valid trip updates while limiting uncontrolled request data.
//
// Big O:
// The whitelist is fixed-size, so request shaping is O(1) regardless of how
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
 *
 * Lists trips and optionally applies enhanced search behavior.
 *
 * If no search criteria are provided, the endpoint preserves the original API
 * contract by returning a plain array of trips. This protects the existing
 * Angular admin listing from breaking.
 *
 * If search criteria are provided, the controller builds a MongoDB filter and
 * delegates the remaining search processing to TripSearchService. That service
 * handles numeric filtering, recommendation scoring, sorting, and pagination.
 *
 * Outcome 3:
 * This method supports Outcome 3 because it applies algorithmic thinking while
 * managing a practical software trade-off: preserving the original response
 * format for existing users while adding an enhanced response format for
 * search-driven requests.
 *
 * Outcome 4:
 * This method supports Outcome 4 because it uses Express, Mongoose, lean reads,
 * query parameters, and a service layer to deliver a more useful API.
 *
 * Big O:
 * With indexed filters, MongoDB can narrow the collection before the service
 * runs. If n is the total number of trips and r is the number of records matched
 * by MongoDB, the application-level work is based on r instead of n.
 *
 * The service layer generally performs filtering/scoring in O(r) and sorting in
 * O(r log r). Sorting is the dominant operation, so the enhanced search path is
 * generally O(r log r) after MongoDB returns the matching records.
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
      // Preserves the original API contract for the Angular admin list, which
      // expects a plain array when no search criteria are submitted.
      //
      // Outcome 3:
      // This is a backward-compatibility trade-off. The endpoint gains enhanced
      // search behavior without forcing all existing frontend code to change.
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
 *
 * Retrieves one trip by its business identifier, trip code.
 *
 * Outcome 3:
 * This supports Outcome 3 because it uses an appropriate lookup strategy for a
 * specific record instead of scanning and filtering the full result set in the
 * controller.
 *
 * Outcome 4:
 * This supports Outcome 4 because it uses Mongoose query methods and lean reads
 * to create a practical, efficient API endpoint.
 *
 * Big O:
 * With an index on code, this lookup targets O(log n) database behavior instead
 * of an O(n) collection scan. The lean() call reduces constant overhead because
 * the API only needs to serialize the result as JSON and does not need a full
 * Mongoose document instance.
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
 *
 * Creates a new trip from a whitelisted request body.
 *
 * Outcome 4:
 * This supports Outcome 4 because it uses Express and Mongoose to persist new
 * trip records through a RESTful API endpoint.
 *
 * Outcome 5:
 * This supports Outcome 5 because the controller does not blindly save the
 * entire request body. It only allows approved fields through sanitizeTripInput,
 * reducing the risk of unexpected or unauthorized fields being persisted.
 *
 * Big O:
 * The request shaping step is O(1) because sanitizeTripInput copies a fixed
 * number of fields. The database insert cost depends on MongoDB and index
 * maintenance, but the controller-side logic is constant time.
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
 *
 * Updates an existing trip by trip code using a whitelisted request body.
 *
 * Outcome 3:
 * This supports Outcome 3 because it updates a specific record through a clear
 * lookup strategy instead of requiring broader application-side searching.
 *
 * Outcome 4:
 * This supports Outcome 4 because it uses Mongoose's findOneAndUpdate with
 * runValidators enabled. This keeps update behavior efficient while preserving
 * model-level validation rules.
 *
 * Outcome 5:
 * This supports Outcome 5 because request-body whitelisting limits what clients
 * can change, and runValidators helps prevent invalid data from bypassing the
 * schema during updates.
 *
 * Big O:
 * With a unique or indexed code field, record selection targets O(log n)
 * database lookup behavior. The sanitizeTripInput function remains O(1) because
 * it copies a fixed set of fields.
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
 *
 * Deletes a trip by trip code.
 *
 * Outcome 3:
 * This supports Outcome 3 because it uses a targeted deletion strategy based on
 * the trip's business identifier.
 *
 * Outcome 4:
 * This supports Outcome 4 because it applies a clear RESTful API pattern for
 * deleting resources in a full-stack application.
 *
 * Outcome 5:
 * This partially supports Outcome 5 by keeping deletion logic centralized in
 * the controller. In a future enhancement, this endpoint should also enforce
 * role-based authorization so only admin users can delete trips.
 *
 * Big O:
 * With an indexed code field, deletion targets O(log n) lookup behavior. The
 * current direct-delete approach is appropriate for simple CRUD, while a future
 * audit-focused system could replace it with soft delete behavior.
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