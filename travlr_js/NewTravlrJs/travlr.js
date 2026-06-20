const mongoose = require('mongoose');

/*
 * Artifact: travlr.js
 * Category: Databases
 *
 * Purpose:
 * This file defines the Mongoose schema for trip records in the Travlr Getaways
 * application. The schema controls how trip data is structured, validated,
 * indexed, and stored in MongoDB.
 *
 * Course Outcome Alignment:
 *
 * Outcome 1:
 * This artifact supports collaborative and organizational decision-making by
 * structuring trip data in a way that can later support admin dashboards,
 * customer search behavior, booking analysis, trip popularity tracking, and
 * business reporting.
 *
 * Outcome 2:
 * This artifact supports professional communication because the comments explain
 * not only what each field stores, but why the field matters to the application,
 * future developers, and database design.
 *
 * Outcome 3:
 * This artifact supports the design and evaluation of computing solutions by
 * improving the database structure, applying validation rules, selecting useful
 * indexes, and managing trade-offs between display-friendly fields and
 * computation-friendly data.
 *
 * Outcome 4:
 * This artifact demonstrates the use of modern database tools and techniques,
 * including MongoDB, Mongoose schemas, validation rules, timestamps, and indexes
 * to support a full-stack travel application.
 *
 * Outcome 5:
 * This artifact supports a security and data integrity mindset by enforcing
 * required fields, uniqueness, length limits, trimming, and schema validation.
 * These controls reduce inconsistent or unexpected data before it reaches other
 * layers of the application.
 *
 * Big O Summary:
 *
 * - Without indexes, searching for a trip by code, resort, name, or start date
 *   can require an O(n) collection scan, where n is the number of trip records.
 * - Indexes move common lookups and sorted access patterns closer to O(log n)
 *   behavior because MongoDB can use indexed access paths instead of scanning
 *   every document.
 * - Maintaining indexes adds write overhead because MongoDB must update the
 *   index when records are inserted or changed. This is a trade-off: slightly
 *   more work on writes in exchange for faster read-heavy workflows.
 * - Schema validation is generally O(1) at the application level because each
 *   document validates a fixed set of fields.
 */

// Trip is the stable catalog model used by both the public travel pages and the
// Angular admin CRUD workflow. This schema keeps display-friendly fields for the
// existing UI while preparing the database for stronger validation, indexing,
// and future analytics.
//
// Outcome 3:
// This demonstrates trade-off management. The schema preserves current display
// fields such as length and perPerson so existing pages continue to work, while
// indexes and validation improve long-term structure and performance.
//
// Big O:
// The indexes below help move common lookups away from O(n) collection scans
// toward O(log n) indexed access patterns as the catalog grows.
const tripSchema = new mongoose.Schema({

  // Code is the business identifier used in API routes and admin operations.
  // Keeping it unique prevents ambiguous update/delete behavior when the app
  // searches for a specific trip by code.
  //
  // Outcome 3:
  // This field supports correct system design because a stable identifier allows
  // the API to target one specific trip reliably.
  //
  // Outcome 5:
  // The required, unique, uppercase, trim, minlength, and maxlength rules improve
  // data integrity by preventing missing, duplicate, inconsistent, or unusually
  // long codes.
  //
  // Big O:
  // The unique index supports near O(log n) lookup behavior by trip code instead
  // of requiring an O(n) scan through every trip document.
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    minlength: 2,
    maxlength: 20
  },

  // Name stores the customer-facing trip title. It is trimmed and length-limited
  // so the database stores clean, predictable values.
  //
  // Outcome 2:
  // Clear field naming and comments help future developers understand how this
  // value appears in the user interface and search workflow.
  //
  // Outcome 4:
  // This supports the full-stack application because the same value is used by
  // MongoDB, the API, the Angular admin interface, and the public travel pages.
  //
  // Big O:
  // The index declared later on name supports faster browsing, filtering, and
  // sorted list behavior than repeated O(n) collection scans.
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },

  // Length remains a string for compatibility with existing seed data and UI
  // display, such as "7 days." The search service currently parses this value
  // when numeric filtering or scoring is required.
  //
  // Outcome 3:
  // This shows a design trade-off. Keeping length as a string preserves existing
  // behavior, but the project also identifies the need for a future numeric
  // lengthDays field to make filtering and sorting more efficient.
  //
  // Big O:
  // Because this value is stored as a display string, numeric comparisons require
  // application-level parsing. If migrated to a numeric lengthDays field later,
  // filtering by duration could be supported more directly by database queries.
  length: {
    type: String,
    required: true,
    trim: true,
    maxlength: 40
  },

  // Start uses a Date type so availability, chronological sorting, seasonal
  // reporting, and future analytics can rely on a native comparable value instead
  // of parsing strings in application code.
  //
  // Outcome 3:
  // Choosing Date instead of String improves the data model because it supports
  // accurate sorting and comparison.
  //
  // Outcome 4:
  // This demonstrates practical use of Mongoose data types to support real
  // application behavior.
  //
  // Big O:
  // The start index declared later helps chronological queries and sorted access
  // avoid O(n) scans when the catalog grows.
  start: {
    type: Date,
    required: true
  },

  // Resort stores the destination or property associated with the trip. It is
  // normalized at write time using trim so filters are less likely to fail due
  // to accidental whitespace.
  //
  // Outcome 1:
  // Resort-based filtering can help customers compare destinations and can help
  // administrators or business users evaluate demand by destination.
  //
  // Outcome 5:
  // Required, trimmed, and length-limited values improve consistency and reduce
  // the chance of poor-quality data entering the system.
  //
  // Big O:
  // The resort index supports O(log n + r) filtering, where r is the number of
  // matching trips returned for a resort search.
  resort: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },

  // Price remains display-formatted for the current UI contract, such as "$1,299."
  // The search service converts this value when numeric filtering or sorting is
  // required.
  //
  // Outcome 3:
  // This reflects a current compatibility trade-off. The display string supports
  // the existing UI, but the project identifies that a future numeric price field
  // would better support filtering, booking totals, and revenue analytics.
  //
  // Outcome 1:
  // Numeric price planning supports future decision-making features, such as
  // budget filtering, booking analysis, and revenue reporting.
  //
  // Big O:
  // Because perPerson is currently a string, numeric sorting requires parsing in
  // the service layer. A future numeric field would allow more efficient and
  // accurate database-level comparisons.
  perPerson: {
    type: String,
    required: true,
    trim: true,
    maxlength: 40
  },

  // Image stores the public asset filename used by templates. Upload processing,
  // file validation, and external storage concerns remain outside this catalog
  // model to keep the trip schema focused on trip data.
  //
  // Outcome 3:
  // This demonstrates separation of concerns because the schema stores the image
  // reference, while file storage behavior can be handled by another layer.
  //
  // Outcome 5:
  // The required, trimmed, and length-limited value helps reduce incomplete or
  // inconsistent image references.
  //
  // Big O:
  // Accessing this field as part of a trip document is O(1) once the document has
  // been retrieved.
  image: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255
  },

  // Description is displayed directly on trip pages and contributes to future
  // recommendation scoring. It is kept with the trip document because it belongs
  // to the catalog record and is commonly retrieved with the rest of the trip.
  //
  // Outcome 1:
  // Rich descriptions help customers make better travel decisions and can later
  // support keyword analysis or recommendation logic.
  //
  // Outcome 4:
  // This supports the full-stack user experience because the same field can be
  // displayed on the public site, edited in the admin interface, and evaluated by
  // the search service.
  //
  // Big O:
  // Reading the description with the trip document is O(1) after retrieval, but
  // broad text searching over descriptions can become O(n) without a text index.
  // A future text index could improve search performance for larger catalogs.
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  } 

}, {
  // Timestamps automatically add createdAt and updatedAt fields.
  //
  // Outcome 4:
  // This demonstrates use of Mongoose features to add useful metadata without
  // manually writing timestamp logic in every controller.
  //
  // Outcome 1:
  // Timestamp metadata can support future admin reporting, auditing, and change
  // tracking.
  //
  // Big O:
  // Timestamps add O(1) metadata writes per document mutation while supporting
  // audit and troubleshooting views without a separate logging collection.
  timestamps: true
});

// These indexes match the current route/search access patterns. Maintaining
// them adds write overhead because MongoDB must update indexes when documents
// change, but they improve read-heavy admin and customer workflows by avoiding
// O(n) scans on common filters and chronological sorts.
//
// Outcome 3:
// These indexes show evaluation of performance trade-offs. The design accepts
// slightly higher write cost to improve frequent read operations.
//
// Outcome 4:
// Indexing demonstrates practical database optimization using MongoDB/Mongoose.
//
// Outcome 1:
// Faster search and filtering improve the usefulness of the application for
// customers, administrators, and future business reporting.
tripSchema.index({ name: 1 });
tripSchema.index({ resort: 1 });
tripSchema.index({ start: 1 });

const Trip = mongoose.model('trips', tripSchema);

module.exports = Trip;