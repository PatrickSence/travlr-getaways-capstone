const apiNotFoundHandler = (req, res) => {
  return res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl
  });
};

const pageNotFoundHandler = (createError) => {
  return function handlePageNotFound(req, res, next) {
    return next(createError(404));
  };
};

const unauthorizedErrorHandler = (err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      message: `${err.name}: ${err.message}`
    });
  }

  return next(err);
};

const apiErrorHandler = ({ isProduction }) => {
  // Production responses hide stack traces while development responses preserve
  // enough context to debug controller and validation failures.
  return function handleApiError(err, req, res, next) {
    const statusCode = err.status || err.statusCode || 500;

    return res.status(statusCode).json({
      success: false,
      message: statusCode === 500 && isProduction
        ? 'Internal server error'
        : err.message,
      ...(isProduction ? {} : { stack: err.stack })
    });
  };
};

const pageErrorHandler = (err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  return res.render('error');
};

module.exports = {
  apiErrorHandler,
  apiNotFoundHandler,
  pageErrorHandler,
  pageNotFoundHandler,
  unauthorizedErrorHandler
};
