const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  tripCode: { type: String, required: true },
  tripName: { type: String, required: true },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  customerPhone: { type: String },
  travelers: { type: Number, required: true, min: 1 },
  notes: { type: String },
  bookedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);