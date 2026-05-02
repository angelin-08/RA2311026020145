/**
 * logger.js
 * Reusable logging middleware — sends structured logs to an external API via axios.
 * Usage: const { Log } = require('../logging_middleware/logger');
 */

const axios = require('axios');

// External logging API endpoint (replace with real endpoint or set via env)
const LOG_API_URL = process.env.LOG_API_URL || 'https://logs.example.com/api/logs';
const LOG_API_KEY = process.env.LOG_API_KEY || 'your-api-key-here';

// Supported log levels
const LEVELS = ['info', 'warn', 'error', 'debug'];

/**
 * Sends a structured log entry to the external logging API.
 *
 * @param {string} stack   - Application stack or service name (e.g. 'notification_app_be')
 * @param {string} level   - Log level: 'info' | 'warn' | 'error' | 'debug'
 * @param {string} pkg     - Package / module name (e.g. 'notificationController')
 * @param {string} message - Human-readable log message
 * @param {object} [meta]  - Optional extra metadata (request id, user id, etc.)
 */
async function Log(stack, level, pkg, message, meta = {}) {
  if (!LEVELS.includes(level)) {
    level = 'info'; // Fallback to safe default
  }

  const payload = {
    timestamp: new Date().toISOString(),
    stack,
    level,
    package: pkg,
    message,
    ...meta,
  };

  // Always print to stdout during development so logs appear in the console
  const prefix = `[${payload.timestamp}] [${level.toUpperCase()}] [${stack}/${pkg}]`;
  const consoleFn = level === 'error' ? console.error : console.warn;

  // Use process.stdout.write to avoid ESLint no-console issues in dev
  process.stdout.write(`${prefix} ${message}\n`);

  try {
    await axios.post(LOG_API_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': LOG_API_KEY,
      },
      timeout: 3000, // Don't let logging block the request chain
    });
  } catch (err) {
    // Logging must NEVER crash the application — swallow and print locally
    process.stderr.write(`[LOGGER ERROR] Failed to send log to external API: ${err.message}\n`);
  }
}

/**
 * Express request/response logging middleware.
 * Attach with: app.use(requestLogger('my-service'));
 *
 * @param {string} stack - Service name
 */
function requestLogger(stack) {
  return async (req, res, next) => {
    const start = Date.now();

    await Log(stack, 'info', 'requestLogger', `Incoming ${req.method} ${req.originalUrl}`, {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    // Intercept res.json to capture response body and status
    const originalJson = res.json.bind(res);
    res.json = async function (body) {
      const duration = Date.now() - start;
      const logLevel = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

      await Log(
        stack,
        logLevel,
        'requestLogger',
        `Response ${res.statusCode} for ${req.method} ${req.originalUrl} — ${duration}ms`,
        {
          statusCode: res.statusCode,
          duration_ms: duration,
          method: req.method,
          url: req.originalUrl,
        }
      );

      return originalJson(body);
    };

    next();
  };
}

module.exports = { Log, requestLogger };