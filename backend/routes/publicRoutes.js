const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { isValidEmail, sanitizeInput } = require('../utils/validators');

// ==========================================
// ROUTES PUBLIQUES (Lecture Seule)
// ==========================================

/**
 * GET /api/public/settings
 * Récupère tous les paramètres globaux (textes de présentation, contacts, liens réseaux)
 */
router.get('/settings', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT setting_key, setting_value FROM settings');
    
    // Transformer le tableau en un objet { 'home_title': '...', 'contact_email': '...' }
    // C'est plus facile à utiliser côté frontend JavaScript
    const settingsObject = {};
    rows.forEach(row => {
      settingsObject[row.setting_key] = row.setting_value;
    });

    res.json(settingsObject);
  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des paramètres.' });
  }
});

/**
 * GET /api/public/projects
 * Récupère tous les projets triés par ordre d'affichage
 */
router.get('/projects', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM projects ORDER BY display_order ASC, created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des projets:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des projets.' });
  }
});

/**
 * GET /api/public/gallery
 * Récupère toutes les images de la galerie triées par ordre d'affichage
 */
router.get('/gallery', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM gallery_images ORDER BY display_order ASC, created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Erreur lors de la récupération de la galerie:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération de la galerie.' });
  }
});

/**
 * GET /api/public/chatbot-questions
 * Récupère les questions/réponses actives pour le chatbot
 */
router.get('/chatbot-questions', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT question, answer FROM chatbot_questions WHERE is_active = TRUE ORDER BY display_order ASC');
    res.json(rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des questions du chatbot:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des questions du chatbot.' });
  }
});

/**
 * POST /api/public/contact
 * Enregistre un message de contact
 */
router.post('/contact', async (req, res) => {
  const name = sanitizeInput(req.body.name || '');
  const email = (req.body.email || '').trim();
  const subject = sanitizeInput(req.body.subject || '');
  const content = sanitizeInput(req.body.content || '');

  if (!name || !email || !content) {
    return res.status(400).json({ error: 'Le nom, l\'email et le message sont requis.' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Adresse email invalide.' });
  }

  try {
    await db.query(
      'INSERT INTO messages (name, email, subject, content) VALUES (?, ?, ?, ?)',
      [name, email, subject, content]
    );

    res.status(201).json({ message: 'Message envoyé avec succès.' });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement du message:', error);
    res.status(500).json({ error: 'Erreur serveur lors de l\'enregistrement du message.' });
  }
});

module.exports = router;
