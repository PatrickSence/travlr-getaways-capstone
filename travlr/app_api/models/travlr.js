// ------------------------------------------------------------
// MONGOOSE IMPORT
// ------------------------------------------------------------
// Import the Mongoose library used to define MongoDB
// schemas and interact with the database.
// Planned Enhancement:
// Future enhancements will expand database relationships,
// validation rules, indexing, and analytics support
// throughout the application.
// ------------------------------------------------------------

const mongoose = require('mongoose');

// ------------------------------------------------------------
// TRIP SCHEMA DEFINITION
// ------------------------------------------------------------
// Define the structure of trip documents stored in the
// MongoDB trips collection.
// This schema currently supports the customer-facing
// travel pages and Angular administrative CRUD features.
// Planned Enhancement:
// Future enhancements will expand this schema to support:
//
// - customer booking relationships
// - saved trips and wishlists
// - trip analytics and popularity tracking
// - recommendation scoring
// - enhanced validation rules
// - indexed search optimization
// - pricing calculations
// - trip categories and tags
// - review and rating support
// ------------------------------------------------------------

const tripSchema = new mongoose.Schema({

  // --------------------------------------------------------
  // Unique trip code used to identify trips throughout
  // the application and API routes.
  // Indexed to improve query performance.
  // Planned Enhancement:
  // Add unique validation and support for optimized
  // search and recommendation algorithms.
  // --------------------------------------------------------
  code: {
    type: String,
    required: true,
    index: true
  },

  // --------------------------------------------------------
  // Name of the travel package or destination.
  // Indexed to improve searching and filtering.
  // Planned Enhancement:
  // Support keyword searching, recommendation scoring,
  // and advanced filtering features.
  // --------------------------------------------------------
  name: {
    type: String,
    required: true,
    index: true
  },

  // --------------------------------------------------------
  // Duration of the trip.
  // Planned Enhancement:
  // Convert to numeric duration values to support
  // improved sorting, filtering, and recommendation logic.
  // --------------------------------------------------------
  length: {
    type: String,
    required: true
  },

  // --------------------------------------------------------
  // Starting date for the trip package.
  // Planned Enhancement:
  // Add indexing and support for seasonal analytics,
  // availability tracking, and calendar-based searches.
  // --------------------------------------------------------
  start: {
    type: Date,
    required: true
  },

  // --------------------------------------------------------
  // Resort or destination associated with the trip.
  // Planned Enhancement:
  // Add location categories and destination metadata
  // to support recommendation and analytics systems.
  // --------------------------------------------------------
  resort: {
    type: String,
    required: true
  },

  // --------------------------------------------------------
  // Price per traveler for the trip package.
  // Currently stored as a string.
  // Planned Enhancement:
  // Convert to Number type to support:
  // - price filtering
  // - sorting
  // - budgeting calculations
  // - booking totals
  // - analytics reporting
  // --------------------------------------------------------
  perPerson: {
    type: String,
    required: true
  },

  // --------------------------------------------------------
  // Image path associated with the trip package.
  // Planned Enhancement:
  // Add image validation, cloud storage integration,
  // and support for multiple gallery images.
  // --------------------------------------------------------
  image: {
    type: String,
    required: true
  },

  // --------------------------------------------------------
  // Detailed trip description displayed to users.
  // Planned Enhancement:
  // Add support for keyword indexing, trip tags,
  // recommendation matching, and AI-assisted search.
  // --------------------------------------------------------
  description: {
    type: String,
    required: true
  }

});

// ------------------------------------------------------------
// MONGOOSE MODEL CREATION
// ------------------------------------------------------------
// Create the Trip model connected to the MongoDB
// trips collection.
// Planned Enhancement:
// Additional related models will be added, including:
//
// - User
// - Booking
// - SavedTrip
// - TripView
// - Review
//
// These models will support a more advanced,
// database-driven travel management platform.
// ------------------------------------------------------------

const Trip = mongoose.model('trips', tripSchema);

// ------------------------------------------------------------
// MODULE EXPORT
// ------------------------------------------------------------
// Export the Trip model so it can be used throughout
// the Express API controllers and application routes.
// ------------------------------------------------------------

module.exports = Trip;