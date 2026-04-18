const express = require('express');
const router = express.Router();
const ctrlMain = require('../controllers/main');
const ctrlTrips = require('../controllers/trips');
const ctrlBookings = require('../controllers/booking');

router.get('/', ctrlMain.travel);
router.get('/:tripcode', ctrlTrips.tripDetails);
router.get('/book/:tripcode', ctrlBookings.bookingForm);
router.post('/book/:tripcode', ctrlBookings.submitBooking);

module.exports = router;