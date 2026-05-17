const rateLimit = require('express-rate-limit');

// Limiteur global simple pour protéger contre le bruteforce
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limite chaque IP à 200 requêtes par windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes, veuillez réessayer plus tard.' }
});

module.exports = limiter;
