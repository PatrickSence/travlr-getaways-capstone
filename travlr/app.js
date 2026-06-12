// Express composition root for Travlr.
// Middleware order, route mounting, and error boundaries are centralized here
// so API controllers, server-rendered pages, and the Angular admin client share
// one predictable request pipeline without duplicating infrastructure logic.
require('dotenv').config();

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const handlebars = require('hbs');
const passport = require('passport');

const indexRouter = require('./app_server/routes/index');
const usersRouter = require('./app_server/routes/users');
const travelRouter = require('./app_server/routes/travel');
const aboutRouter = require('./app_server/routes/about');
const contactRouter = require('./app_server/routes/contact');
const mealsRouter = require('./app_server/routes/meals');
const newsRouter = require('./app_server/routes/news');
const roomsRouter = require('./app_server/routes/rooms');
const apiRouter = require('./app_api/routes/index');

const apiResponseHelper = require('./app_api/middleware/apiResponse');
const createCorsMiddleware = require('./app_api/middleware/cors');
const {
  apiErrorHandler,
  apiNotFoundHandler,
  pageErrorHandler,
  pageNotFoundHandler,
  unauthorizedErrorHandler
} = require('./app_api/middleware/errorHandlers');
const securityHeaders = require('./app_api/middleware/securityHeaders');

// Database and authentication modules read environment values while they are
// initialized, so configuration is loaded before these app-level dependencies.
require('./app_api/models/db');
require('./app_api/config/passport');

const app = express();
const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

// The origin list is normalized once at startup so deployed Angular clients can
// be added through configuration without changing application code.
const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:4200')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable('x-powered-by');

app.set('views', path.join(__dirname, 'app_server', 'views'));
handlebars.registerPartials(path.join(__dirname, 'app_server', 'views', 'partials'));
app.set('view engine', 'hbs');

app.use(logger(isProduction ? 'combined' : 'dev'));
app.use(securityHeaders);

// Request size limits run before controllers so oversized payloads are rejected
// consistently before they can consume route or database resources.
app.use(express.json({ limit: process.env.JSON_LIMIT || '1mb' }));
app.use(express.urlencoded({ extended: false, limit: process.env.FORM_LIMIT || '1mb' }));
app.use(cookieParser());

// Static assets are cacheable in production for lower repeat-load cost, while
// development keeps cache disabled so page and CSS changes are immediately visible.
app.use(
  express.static(path.join(__dirname, 'public'), {
    maxAge: isProduction ? '1d' : 0,
    etag: true
  })
);

app.use(passport.initialize());

// API-only middleware keeps browser cross-origin and JSON response policies off
// the customer-facing Handlebars pages, preserving separate response surfaces.
app.use('/api', createCorsMiddleware(corsOrigins));
app.use('/api', apiResponseHelper);

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/travel', travelRouter);
app.use('/about', aboutRouter);
app.use('/contact', contactRouter);
app.use('/meals', mealsRouter);
app.use('/news', newsRouter);
app.use('/rooms', roomsRouter);
app.use('/api', apiRouter);

// Error middleware is ordered from specific to general so API clients receive
// JSON contracts while browser users receive rendered site pages.
app.use('/api', apiNotFoundHandler);
app.use(pageNotFoundHandler(createError));
app.use(unauthorizedErrorHandler);
app.use('/api', apiErrorHandler({ isProduction }));
app.use(pageErrorHandler);

module.exports = app;
