// This helper provides a gradual path toward consistent API response envelopes
// without forcing every existing controller to be rewritten at once.
const apiResponseHelper = (req, res, next) => {
  res.apiSuccess = function apiSuccess(data, statusCode = 200, meta = undefined) {
    return res.status(statusCode).json({
      success: true,
      data,
      ...(meta ? { meta } : {})
    });
  };

  return next();
};

module.exports = apiResponseHelper;
