const express = require('express');
const router = express.Router();
const tripscontroller = require('../controllers/trips');
const authController = require('../controllers/authentication');
const bookingscontroller = require('../controllers/bookings');
const viewscontroller = require('../controllers/views');
const authenticateJWT = require('../middleware/authenticateJwt');

router
  .route('/register')
  .post(authenticateJWT, authController.register);

router
  .route('/admin-users/password')
  .put(authenticateJWT, authController.updatePassword);

router
  .route('/trips')
  .get(tripscontroller.tripsList)
  .post(authenticateJWT, tripscontroller.tripAddTrip);

router
  .route('/trips/:tripcode')
  .get(tripscontroller.tripsFindByCode)
  .put(authenticateJWT, tripscontroller.tripsUpdateTrip)
  .delete(authenticateJWT, tripscontroller.tripsDeleteTrip);

router
  .route('/bookings')
  .get(authenticateJWT, bookingscontroller.bookingsList);

router
  .route('/views')
  .get(authenticateJWT, viewscontroller.viewsList);

router
  .route('/login')
  .post(authController.login);

module.exports = router;
