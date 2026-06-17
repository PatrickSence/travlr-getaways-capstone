const mongoose = require('mongoose');
const User = require('../models/user');
const passport = require('passport');

const MIN_PASSWORD_LENGTH = 12;

const isStrongPassword = (password) => {
  return (
    typeof password === 'string'
    && password.length >= MIN_PASSWORD_LENGTH
    && /[a-z]/.test(password)
    && /[A-Z]/.test(password)
    && /\d/.test(password)
    && /[^A-Za-z0-9]/.test(password)
  );
};

const login = (req, res) => {
// Validate message to ensure that email and password are present.
    if (!req.body.email || !req.body.password) {
    return res
        .status(400)
        .json({"message": "All fields required"});
    }
// Delegate authentication to passport module
passport.authenticate('local', (err, user, info) => {
    if (err) {
// Error in Authentication Process
    return res
        .status(404)
        .json(err);
}
    if (user) { // Auth succeeded - generate JWT and return to caller
        const token = user.generateJWT();
        res
            .status(200)
            .json({token});
        } else { // Auth failed return error
    res
        .status(401)
        .json(info);
        }
    })(req, res);
};

const register = async (req, res) => {
  // Validate message to ensure that all parameters are present
  if (!req.body.name || !req.body.email || !req.body.password) {
    return res
      .status(400)
      .json({ "message": "All fields required" });
  }

  if (!isStrongPassword(req.body.password)) {
    return res
      .status(400)
      .json({
        message: 'Password must be at least 12 characters and include uppercase, lowercase, number, and symbol.'
      });
  }

  const existingUser = await User.findOne({
    email: req.body.email.trim().toLowerCase()
  }).exec();

  if (existingUser) {
    return res
      .status(409)
      .json({ message: 'An admin user with that email already exists' });
  }

  const user = new User({
    name: req.body.name.trim(),
    email: req.body.email.trim().toLowerCase(),
    role: 'admin'
  });

  user.setPassword(req.body.password); // Set user password
  const q = await user.save();

  if (!q) {
    // Database returned no data
    return res
      .status(400)
      .json({ message: "User registration failed" });
  } else {
    return res
      .status(201)
      .json({
        message: 'Admin user created',
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
  }
};

const updatePassword = async (req, res) => {
  if (!req.body.email || !req.body.password) {
    return res
      .status(400)
      .json({ message: 'Email and password are required' });
  }

  if (!isStrongPassword(req.body.password)) {
    return res
      .status(400)
      .json({
        message: 'Password must be at least 12 characters and include uppercase, lowercase, number, and symbol.'
      });
  }

  const user = await User.findOne({
    email: req.body.email.trim().toLowerCase()
  }).exec();

  if (!user) {
    return res
      .status(404)
      .json({ message: 'Admin user not found' });
  }

  user.setPassword(req.body.password);
  await user.save();

  return res
    .status(200)
    .json({
      message: 'Admin password updated',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
};

module.exports = {
  register,
  login,
  updatePassword
};
