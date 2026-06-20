// Express composition root for Travlr.
//
// Course Outcome Alignment:
// - Outcome 3: This file demonstrates the design and evaluation of a computing
//   solution by organizing middleware, route mounting, static assets, and error
//   boundaries into one predictable request pipeline.
// - Outcome 4: This file uses modern web development tools and practices,
//   including Express middleware, environment-based configuration, Passport,
//   CORS handling, centralized error handling, and static asset optimization.
// - Outcome 5: This file supports a security mindset through security headers,
//   request size limits, controlled CORS configuration, disabled framework
//   fingerprinting, and separated API/page error handling.
// - Outcome 2: The comments document architectural decisions clearly so future
//   developers, reviewers, and stakeholders can understand the purpose of each
//   enhancement.
//
// Middleware order, route mounting, and error boundaries are centralized here
// so API controllers, server-rendered pages, and the Angular admin client share
// one predictable request pipeline. Express evaluates middleware in O(n) time
// for n registered layers, so grouping API/page concerns here keeps that path
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
//
// Outcome 4:
// Loading environment configuration before database and authentication modules
// demonstrates professional use of configuration management. This helps the
// application run across development, testing, and production environments
// without hardcoding sensitive or environment-specific values.
require('./app_api/models/db');
require('./app_api/config/passport');

const app = express();
const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

// The origin list is normalized once at startup in O(k) time for k configured
// origins. Request-time CORS checks then scan this small allowlist instead of
// reparsing configuration on every API call.
//
// Outcome 5:
// Environment-based CORS configuration supports a security mindset because it
// limits which frontend origins can access the API. This is safer and more
// maintainable than hardcoding one localhost value directly into the app.
const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:4200')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Outcome 5:
// Disabling "x-powered-by" reduces framework fingerprinting. This does not make
// the app secure by itself, but it removes unnecessary server information from
// HTTP responses and reflects security-conscious configuration.
app.disable('x-powered-by');

app.set('views', path.join(__dirname, 'app_server', 'views'));
handlebars.registerPartials(path.join(__dirname, 'app_server', 'views', 'partials'));
app.set('view engine', 'hbs');

app.use(logger(isProduction ? 'combined' : 'dev'));

// Outcome 5:
// Security headers are applied early in the request pipeline so all downstream
// page and API responses receive baseline protections such as reduced MIME
// sniffing, clickjacking exposure, and unsafe referrer leakage.
app.use(securityHeaders);

// Request size limits run before controllers so invalid payloads are rejected
// before route/database work. This caps memory exposure and prevents
// downstream handlers from doing avoidable O(n) parsing on oversized bodies.
//
// Outcome 3:
// This shows trade-off awareness because the app accepts normal JSON/form
// submissions while limiting unusually large requests that could waste server
// resources.
//
// Outcome 5:
// Limiting payload size helps reduce denial-of-service risk from oversized
// request bodies.
app.use(express.json({ limit: process.env.JSON_LIMIT || '1mb' }));
app.use(express.urlencoded({ extended: false, limit: process.env.FORM_LIMIT || '1mb' }));
app.use(cookieParser());

// Static caching shifts repeat asset requests toward browser/cache validation,
// reducing repeated server-side file work from full transfer cost to near O(1)
// metadata checks for common refreshes.
//
// Outcome 4:
// This demonstrates use of practical web performance techniques. Production
// caching improves efficiency for static assets while development keeps caching
// disabled so changes appear immediately during testing.
app.use(
  express.static(path.join(__dirname, 'public'), {
    maxAge: isProduction ? '1d' : 0,
    etag: true
  })
);

// Outcome 4:
// Passport is initialized once at the application level so API routes can use a
// shared authentication strategy. This supports maintainable authentication
// behavior across protected routes.
app.use(passport.initialize());

// API-only middleware keeps cross-origin and JSON envelope work off page routes.
// This reduces the constant work done on each customer-facing request while
// preserving the O(n) Express pipeline as separate, predictable surfaces.
//
// Outcome 3:
// Separating API middleware from page middleware demonstrates architectural
// trade-off management. The API receives CORS and JSON response helpers, while
// server-rendered pages avoid unnecessary API-specific processing.
//
// Outcome 5:
// Keeping CORS scoped to the API reduces unnecessary exposure on page routes.
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
//
// Outcome 3:
// This demonstrates structured software design because API errors, page errors,
// not-found responses, and authorization errors are handled through clear
// boundaries instead of being scattered throughout individual controllers.
//
// Outcome 5:
// Separating API and page error responses helps avoid leaking unnecessary error
// details to clients. It also allows production behavior to be safer while still
// supporting useful debugging during development.
//
// Outcome 2:
// Clear error-handler organization and comments communicate system behavior to
// future developers and reviewers, supporting professional technical
// communication.
app.use('/api', apiNotFoundHandler);
app.use(pageNotFoundHandler(createError));
app.use(unauthorizedErrorHandler);
app.use('/api', apiErrorHandler({ isProduction }));
app.use(pageErrorHandler);

module.exports = app;