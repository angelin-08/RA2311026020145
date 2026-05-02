const { Log } = require('../../logging_middleware/logger');

/**
 * Central error handler to capture uncaught route errors.
 */
async function errorHandler(err, req, res, next) {
  await Log('notification_app_be/src/middlewares/errorHandler.js', 'error', 'notification_app_be', 'Unhandled exception caught', {
    message: err.message,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
  });

  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal server error',
  });
}

module.exports = {
  errorHandler,
};
