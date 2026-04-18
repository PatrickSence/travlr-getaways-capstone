const Trip = require('../../app_api/models/travlr');
const TripView = require('../../app_api/models/tripView');

const tripDetails = async (req, res) => {
  try {
    const trip = await Trip.findOne({ code: req.params.tripcode }).exec();

    if (!trip) {
      return res.status(404).render('error', {
        message: 'Trip not found'
      });
    }

    await TripView.create({
      tripCode: trip.code,
      tripName: trip.name,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    return res.render('trip-details', {
      title: trip.name,
      trip
    });
  } catch (err) {
    console.log('tripDetails error:', err);
    return res.status(500).render('error', {
      message: 'Could not load trip details'
    });
  }
};

module.exports = {
  tripDetails
};