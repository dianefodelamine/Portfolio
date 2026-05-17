const validator = require('validator');

function isValidEmail(email) {
  return !!email && validator.isEmail(String(email));
}

function isStrongPassword(password) {
  if (!password || typeof password !== 'string') return false;
  return password.length >= 8 && !validator.isEmpty(password);
}

function sanitizeInput(value) {
  if (typeof value !== 'string') return value;
  return validator.escape(value.trim());
}

function parseInteger(value, defaultValue = 0) {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? defaultValue : parsed;
}

module.exports = { isValidEmail, isStrongPassword, sanitizeInput, parseInteger };
