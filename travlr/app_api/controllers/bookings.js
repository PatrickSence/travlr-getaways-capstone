const mongoose = require('mongoose');
const Booking = mongoose.model('Booking');

const bookingsList = async (req, res) => {
  try {
    const bookings = await Booking.find();
    console.log('Bookings from DB:', bookings);
    res.status(200).json(bookings);
  } catch (err) {
    console.error('Bookings error:', err);
    res.status(500).json(err);
  }
};

module.exports = {
  bookingsList
};