const { Log } = require('../../logging_middleware/logger');

/**
 * Request logging middleware for every incoming request.
 */
function requestLogger(req, res, next) {
  const start = process.hrtime.bigint();
  const { method, originalUrl, headers, body, query } = req;

  Log('notification_app_be/src/middlewares/requestLogger.js', 'info', 'notification_app_be', 'Request received', {
    method,
    originalUrl,
    headers: {
      authorization: headers.authorization,
      contentType: headers['content-type'],
    },
    query,
    body,
  });

  res.on('finish', async () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    await Log('notification_app_be/src/middlewares/requestLogger.js', 'info', 'notification_app_be', 'Response sent', {
      method,
      originalUrl,
      statusCode: res.statusCode,
      durationMs: durationMs.toFixed(2),
    });
  });

  next();
}

module.exports = {
  requestLogger,
};
