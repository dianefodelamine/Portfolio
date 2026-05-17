const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const db = require('../config/db');
const { verifyAdminToken } = require('../middleware/authMiddleware');
const { isValidEmail, isStrongPassword, sanitizeInput } = require('../utils/validators');
const { logger } = require('../middleware/logger');

const router = express.Router();

async function getAdminCount() {
  const [rows] = await db.query('SELECT COUNT(*) AS count FROM users');
  return rows[0].count;
}

function createResetToken() {
  return crypto.randomBytes(32).toString('hex');
}

function createTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
}

async function sendResetEmail(email, token) {
  const transporter = createTransporter();
  if (!transporter) {
    return false;
  }

  const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/admin/reset-password.html?token=${token}`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: 'Réinitialisation de votre mot de passe administrateur',
    html: `
      <p>Vous avez demandé la réinitialisation de votre mot de passe administrateur.</p>
      <p>Cliquez sur le lien ci-dessous pour définir un nouveau mot de passe :</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>Ce lien expirera dans 1 heure.</p>
    `,
  });

  return true;
}

router.post('/login', async (req, res) => {
  const identifier = sanitizeInput(req.body.username || '');
  const password = req.body.password || '';

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Nom d\'utilisateur / email et mot de passe requis.' });
  }

  try {
    const [rows] = await db.query(
      'SELECT id, username, password FROM users WHERE username = ? OR email = ?',
      [identifier, identifier]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Identifiants invalides.' });
    }

    const user = rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Identifiants invalides.' });
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET manquant. Ajoutez-le dans backend/.env et redémarrez le serveur.');
      return res.status(500).json({ error: 'Erreur serveur : variable JWT_SECRET manquante.' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    logger.info(`User ${user.username} logged in from ${req.ip}`);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la tentative de connexion:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la connexion.' });
  }
});

router.post('/register', async (req, res) => {
  const full_name = sanitizeInput(req.body.full_name || '');
  const username = sanitizeInput(req.body.username || '');
  const email = (req.body.email || '').trim();
  const phone = sanitizeInput(req.body.phone || '');
  const password = req.body.password || '';

  if (!full_name || !username || !email || !phone || !password) {
    return res.status(400).json({ error: 'Nom, utilisateur, email, téléphone et mot de passe sont requis.' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Adresse email invalide.' });
  }

  if (!isStrongPassword(password)) {
    return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères.' });
  }

  try {
    const adminCount = await getAdminCount();
    if (adminCount > 0) {
      return res.status(403).json({ error: 'L\'enregistrement initial est déjà effectué.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    await db.query(
      'INSERT INTO users (full_name, username, email, phone, password) VALUES (?, ?, ?, ?, ?)',
      [full_name, username, email, phone, hashedPassword]
    );

    logger.info(`New admin registered: ${username} (${email}) from ${req.ip}`);
    res.status(201).json({ message: 'Administrateur créé avec succès.' });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de l\'administrateur:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Le nom d\'utilisateur ou l\'email est déjà utilisé.' });
    }
    res.status(500).json({ error: 'Erreur serveur lors de l\'enregistrement.' });
  }
});

router.get('/register-available', async (req, res) => {
  try {
    const adminCount = await getAdminCount();
    res.json({ available: adminCount === 0 });
  } catch (error) {
    console.error('Erreur vérification disponibilité enregistrement:', error);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

router.post('/request-reset', async (req, res) => {
  const email = (req.body.email || '').trim();
  const username = sanitizeInput(req.body.username || '');

  if (!email && !username) {
    return res.status(400).json({ error: 'Email ou nom d\'utilisateur requis.' });
  }

  if (email && !isValidEmail(email)) {
    return res.status(400).json({ error: 'Adresse email invalide.' });
  }

  try {
    const [rows] = await db.query(
      'SELECT id, email FROM users WHERE email = ? OR username = ? LIMIT 1',
      [email || '', username || '']
    );
    if (rows.length === 0) {
      return res.status(200).json({ message: 'Si ce compte existe, un lien de réinitialisation a été envoyé.' });
    }

    const user = rows[0];
    const token = createResetToken();
    const expiresAt = new Date(Date.now() + 3600000); // 1 heure

    await db.query('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?', [token, expiresAt, user.id]);

    const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/admin/reset-password.html?token=${token}`;
    const emailSent = await sendResetEmail(user.email, token);
    if (!emailSent) {
      return res.json({
        message: 'Le lien de réinitialisation a été généré. Utilisez le lien ci-dessous pour définir votre nouveau mot de passe.',
        resetUrl,
      });
    }

    res.json({ message: 'Si ce compte existe, un lien de réinitialisation a été envoyé à l\'email associé.' });
  } catch (error) {
    console.error('Erreur demande de réinitialisation:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la demande de réinitialisation.' });
  }
});

router.post('/reset-password', async (req, res) => {
  const token = sanitizeInput(req.body.token || '');
  const password = req.body.password || '';

  if (!token || !password) {
    return res.status(400).json({ error: 'Token de réinitialisation et nouveau mot de passe requis.' });
  }

  if (!isStrongPassword(password)) {
    return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères.' });
  }

  try {
    const [rows] = await db.query('SELECT id, reset_token_expires FROM users WHERE reset_token = ? LIMIT 1', [token]);
    if (rows.length === 0) {
      return res.status(400).json({ error: 'Token invalide ou expiré.' });
    }

    const user = rows[0];
    if (!user.reset_token_expires || new Date(user.reset_token_expires) < new Date()) {
      return res.status(400).json({ error: 'Token expiré. Demandez une nouvelle réinitialisation.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    await db.query('UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?', [hashedPassword, user.id]);

    res.json({ message: 'Mot de passe réinitialisé avec succès.' });
  } catch (error) {
    console.error('Erreur réinitialisation du mot de passe:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la réinitialisation.' });
  }
});

router.get('/me', verifyAdminToken, async (req, res) => {
  res.json({ id: req.user.id, username: req.user.username });
});

module.exports = router;
