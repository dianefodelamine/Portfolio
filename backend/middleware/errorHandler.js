const { logger } = require('./logger');

function errorHandler(err, req, res, next) {
  logger.error(`Unhandled error: ${err.message}`);
  console.error(err);
  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({ error: 'Erreur serveur interne. Veuillez réessayer plus tard.' });
}

module.exports = errorHandler;
