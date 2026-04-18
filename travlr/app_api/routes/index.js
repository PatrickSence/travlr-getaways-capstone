const express = require('express');
const router = express.Router();
const tripscontroller = require('../controllers/trips');
const authController = require('../controllers/authentication');
const bookingscontroller = require('../controllers/bookings');
const viewscontroller = require('../controllers/views');
const jwt = require('jsonwebtoken');

// Method to authenticate our JWT
function authenticateJWT(req, res, next) {
  console.log('--- authenticateJWT start ---');
  console.log('Method:', req.method);
  console.log('URL:', req.originalUrl);

  const authHeader = req.headers['authorization'];
  console.log('Authorization header:', authHeader);

  if (!authHeader) {
    console.log('Auth Header Required but NOT PRESENT!');
    return res.sendStatus(401);
  }

  const headers = authHeader.split(' ');
  if (headers.length < 2) {
    console.log('Invalid Authorization header format');
    return res.sendStatus(401);
  }

  const token = headers[1];
  console.log('Extracted token:', token);

  if (!token) {
    console.log('Null Bearer Token');
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, verified) => {
    if (err) {
      console.log('Token validation error:', err.message);
      return res.status(401).json({ message: 'Token validation error' });
    }

    console.log('JWT verified successfully');
    req.auth = verified;
    console.log('Calling next() from authenticateJWT');
    next();
  });
}

router
  .route('/register')
  .post(authController.register);

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