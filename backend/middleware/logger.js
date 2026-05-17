const { createLogger, transports, format } = require('winston');

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.printf(({ timestamp, level, message }) => `${timestamp} [${level}] ${message}`)
  ),
  transports: [
    new transports.Console()
  ],
});

function requestLogger(req, res, next) {
  logger.info(`${req.method} ${req.originalUrl} - ${req.ip}`);
  next();
}

module.exports = { logger, requestLogger };
