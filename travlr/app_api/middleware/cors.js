const createCorsMiddleware = (corsOrigins) => {
  // The allowlist is captured in a closure so CORS policy is configured once at
  // startup and cannot be modified by request handlers.
  return function corsMiddleware(req, res, next) {
    const requestOrigin = req.headers.origin;

    // Non-browser tools omit Origin, so they are allowed without weakening the
    // browser allowlist enforced for Angular requests.
    if (!requestOrigin || corsOrigins.includes(requestOrigin)) {
      res.header('Access-Control-Allow-Origin', requestOrigin || corsOrigins[0]);
      res.header('Vary', 'Origin');
    }

    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

    // Preflight requests stop here to avoid running controller logic for browser
    // permission checks that do not need application data.
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }

    return next();
  };
};

module.exports = createCorsMiddleware;
