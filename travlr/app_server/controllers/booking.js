const Trip = require('../../app_api/models/travlr');
const Booking = require('../../app_api/models/booking');

const bookingForm = async (req, res) => {
  try {
    const trip = await Trip.findOne({ code: req.params.tripcode }).exec();

    if (!trip) {
      return res.status(404).render('error', {
        message: 'Trip not found'
      });
    }

    return res.render('booking-form', {
      title: `Book ${trip.name}`,
      trip
    });
  } catch (err) {
    console.log('bookingForm error:', err);
    return res.status(500).render('error', {
      message: 'Could not load booking form'
    });
  }
};

const submitBooking = async (req, res) => {
  try {
    const trip = await Trip.findOne({ code: req.params.tripcode }).exec();

    if (!trip) {
      return res.status(404).render('error', {
        message: 'Trip not found'
      });
    }

    const booking = await Booking.create({
      tripCode: trip.code,
      tripName: trip.name,
      customerName: req.body.customerName,
      customerEmail: req.body.customerEmail,
      customerPhone: req.body.customerPhone,
      travelers: req.body.travelers,
      notes: req.body.notes
    });

    return res.render('booking-success', {
      title: 'Booking Confirmed',
      trip,
      booking
    });
  } catch (err) {
    console.log('submitBooking error:', err);
    return res.status(500).render('error', {
      message: 'Could not save booking'
    });
  }
};

module.exports = {
  bookingForm,
  submitBooking
};