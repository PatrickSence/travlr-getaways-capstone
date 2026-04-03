const express = require('express');
const router = express.Router();
const tripscontroller = require('../controllers/trips');

router.route('/trips')
    .get(tripscontroller.tripsList);
router.route('/trips/:tripcode')
    .get(tripscontroller.tripsFindByCode);

module.exports = router;