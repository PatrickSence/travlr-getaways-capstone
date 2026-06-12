// Security headers are applied once at the application boundary so every route
// receives the same baseline browser protections without duplicating policy in
// individual controllers.
const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  return next();
};

module.exports = securityHeaders;
