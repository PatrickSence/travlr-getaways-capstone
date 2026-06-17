const mongoose = require('mongoose');

// Trip is the stable catalog model used by both the public travel pages and the
// Angular admin CRUD workflow, so this schema keeps display-friendly fields
// while the service layer handles derived search/scoring behavior. Indexes below
// move common lookups from O(n) collection scans toward O(log n) access paths.
const tripSchema = new mongoose.Schema({

  // Code is the business identifier used in routes and admin operations; keeping
  // it unique prevents ambiguous update/delete behavior. The unique index also
  // supports near O(log n) route lookups by trip code as the catalog grows.
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    minlength: 2,
    maxlength: 20
  },

  // Name is indexed because dashboard browsing often sorts or filters by label;
  // indexed access avoids repeatedly scanning every trip for common list views.
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },

  // Length remains a string for compatibility with existing seed data and UI
  // display; numeric parsing is isolated in the search service until migration.
  length: {
    type: String,
    required: true,
    trim: true,
    maxlength: 40
  },

  // Start uses a Date so later availability, analytics, and chronological
  // sorting can rely on a native comparable value and an ordered index rather
  // than parsing strings in O(n) application code.
  start: {
    type: Date,
    required: true
  },

  // Resort is normalized at write time so dashboard filters avoid mismatches
  // caused by accidental whitespace. The resort index supports O(log n + r)
  // filtering where r is the number of matching trips.
  resort: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },

  // Price remains display-formatted for the current UI contract. The search
  // service converts it when numeric filtering or sorting is required.
  perPerson: {
    type: String,
    required: true,
    trim: true,
    maxlength: 40
  },

  // Image stores the public asset filename used by templates; upload/storage
  // concerns stay outside this catalog model.
  image: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255
  },

  // Description is kept on the trip document because it is displayed directly
  // and contributes to recommendation scoring.
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  }

}, {
  // Timestamps add O(1) metadata writes per mutation while supporting audit and
  // troubleshooting views without a separate logging collection.
  timestamps: true
});

// These indexes match the current route/search access patterns. Maintaining
// them adds write overhead, but improves read-heavy admin/customer workflows by
// avoiding O(n) scans on common filters and chronological sorts.
tripSchema.index({ name: 1 });
tripSchema.index({ resort: 1 });
tripSchema.index({ start: 1 });

const Trip = mongoose.model('trips', tripSchema);

module.exports = Trip;
