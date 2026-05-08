const mongoose = require('mongoose');

const tripViewSchema = new mongoose.Schema({
  tripCode: { type: String, required: true },
  tripName: { type: String, required: true },
  viewedAt: { type: Date, default: Date.now },
  ipAddress: { type: String },
  userAgent: { type: String }
});

module.exports = mongoose.model('TripView', tripViewSchema);