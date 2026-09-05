/**
 * Request Logging Middleware
 * Provides clear diagnostic visibility into incoming requests, response times, and failure points.
 */
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const url = req.originalUrl || req.url;
  const method = req.method;

  // Intercept response finish to calculate total duration and log outcome
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const userId = req.user ? (req.user.id || req.user._id) : 'anonymous';

    let statusEmoji = '✅';
    if (statusCode >= 500) {
      statusEmoji = '💥';
    } else if (statusCode >= 400) {
      statusEmoji = '⚠️';
    }

    const logLine = `[HTTP] ${statusEmoji} ${method} ${url} ${statusCode} (${duration}ms) [User: ${userId}]`;

    if (statusCode >= 500) {
      console.error(logLine);
    } else if (statusCode >= 400) {
      console.warn(logLine);
    } else {
      console.log(logLine);
    }
  });

  next();
};

module.exports = requestLogger;
