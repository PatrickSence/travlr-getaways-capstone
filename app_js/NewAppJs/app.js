// Express composition root for Travlr.
// Middleware order, route mounting, and error boundaries are centralized here
// so API controllers, server-rendered pages, and the Angular admin client share
// one predictable request pipeline. Express evaluates middleware in O(m) time
// for m registered layers, so grouping API/page concerns here keeps that path
// explicit and avoids duplicated per-controller routing work.
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

// The origin list is normalized once at startup in O(k) time for k configured
// origins. Request-time CORS checks then scan this small allowlist instead of
// reparsing configuration on every API call.
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

// Request size limits run before controllers so invalid payloads are rejected
// before route/database work. This caps memory exposure per request and prevents
// downstream handlers from doing avoidable O(n) parsing on oversized bodies.
app.use(express.json({ limit: process.env.JSON_LIMIT || '1mb' }));
app.use(express.urlencoded({ extended: false, limit: process.env.FORM_LIMIT || '1mb' }));
app.use(cookieParser());

// Static caching shifts repeat asset requests toward browser/cache validation,
// reducing repeated server-side file work from full transfer cost to near O(1)
// metadata checks for common refreshes.
app.use(
  express.static(path.join(__dirname, 'public'), {
    maxAge: isProduction ? '1d' : 0,
    etag: true
  })
);

app.use(passport.initialize());

// API-only middleware keeps cross-origin and JSON envelope work off page routes.
// This reduces the constant work done on each customer-facing request while
// preserving the O(m) Express pipeline as separate, predictable surfaces.
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

// Error middleware is ordered from specific to general. The first matching
// handler terminates the pipeline, avoiding unnecessary downstream checks and
// keeping error resolution linear in the small number of registered handlers.
app.use('/api', apiNotFoundHandler);
app.use(pageNotFoundHandler(createError));
app.use(unauthorizedErrorHandler);
app.use('/api', apiErrorHandler({ isProduction }));
app.use(pageErrorHandler);

module.exports = app;
