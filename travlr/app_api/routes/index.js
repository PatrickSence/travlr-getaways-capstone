const express = require('express');
const router = express.Router();
const tripscontroller = require('../controllers/trips');

router
    .route('/trips')
    .get(tripscontroller.tripsList)
    .post(tripscontroller.tripAddTrip);
router
    .route('/trips/:tripcode')
    .get(tripscontroller.tripsFindByCode)
    .put(tripscontroller.tripsUpdateTrip);

module.exports = router;