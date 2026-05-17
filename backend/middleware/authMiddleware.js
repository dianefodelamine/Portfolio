const jwt = require('jsonwebtoken');
require('dotenv').config();

function verifyAdminToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Jeton d\'authentification manquant.' });
  }

  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET non défini dans la configuration.');
    return res.status(500).json({ error: 'Configuration serveur incorrecte.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (error) {
    console.error('Erreur de validation du token JWT:', error.message);
    return res.status(401).json({ error: 'Jeton invalide ou expiré.' });
  }
}

module.exports = {
  verifyAdminToken,
};
