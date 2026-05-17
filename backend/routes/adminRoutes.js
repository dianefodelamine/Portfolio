const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const sharp = require('sharp');
const { verifyAdminToken } = require('../middleware/authMiddleware');
const { sanitizeInput, parseInteger, isStrongPassword } = require('../utils/validators');

const router = express.Router();
router.use(verifyAdminToken);

// Configure multer pour stocker les uploads dans /uploads à la racine du projet
const uploadsDir = path.join(__dirname, '../../uploads');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${file.fieldname}${ext}`;
    cb(null, name);
  }
});
function imageFileFilter(req, file, cb) {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé. Utilisez une image (jpg, png, webp, gif, svg).'));
  }
}

const upload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
});

// Endpoint d'upload protégé pour les images (retourne l'URL publique)
router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Fichier requis.' });

  const minDim = 200; // px
  const maxDim = 3000; // px
  const optimizeMax = 1200; // px

  try {
    const filePath = req.file.path;
    const meta = await sharp(filePath).metadata();
    const width = meta.width || 0;
    const height = meta.height || 0;
    const format = meta.format || '';

    if ((width && width < minDim) || (height && height < minDim)) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: `Image trop petite. Dimensions minimales : ${minDim}x${minDim} px.` });
    }

    if ((width && width > maxDim) || (height && height > maxDim)) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: `Image trop grande. Dimensions maximales : ${maxDim}x${maxDim} px.` });
    }

    // Optimize: resize if larger than optimizeMax and recompress according to format
    let outFilename = req.file.filename;
    let outPath = filePath;

    if (format === 'svg') {
      // keep SVG as-is (vector)
    } else if (format === 'gif') {
      // convert GIF to webp for better compression
      outFilename = outFilename.replace(path.extname(outFilename), '.webp');
      outPath = path.join(uploadsDir, outFilename);
      let pipeline = sharp(filePath, { animated: true }).resize({ width: Math.min(width, optimizeMax), height: Math.min(height, optimizeMax), fit: 'inside' }).webp({ quality: 80 });
      await pipeline.toFile(outPath);
      fs.unlinkSync(filePath);
    } else {
      let pipeline = sharp(filePath);
      if (width > optimizeMax || height > optimizeMax) {
        pipeline = pipeline.resize({ width: Math.min(width, optimizeMax), height: Math.min(height, optimizeMax), fit: 'inside' });
      }

      if (format === 'jpeg' || format === 'jpg') {
        await pipeline.jpeg({ quality: 80, mozjpeg: true }).toFile(outPath);
      } else if (format === 'png') {
        await pipeline.png({ compressionLevel: 9 }).toFile(outPath);
      } else if (format === 'webp') {
        await pipeline.webp({ quality: 80 }).toFile(outPath);
      } else {
        // unknown raster format: attempt to write as webp
        outFilename = outFilename.replace(path.extname(outFilename), '.webp');
        outPath = path.join(uploadsDir, outFilename);
        await pipeline.webp({ quality: 80 }).toFile(outPath);
        fs.unlinkSync(filePath);
      }
    }

    const publicUrl = `/uploads/${outFilename}`;
    res.json({ url: publicUrl });
  } catch (error) {
    console.error('Erreur traitement image upload:', error);
    try { if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); } catch (e) {}
    res.status(500).json({ error: 'Erreur lors du traitement de l\'image.' });
  }
});

function buildUpdateQuery(table, id, fields) {
  const updateEntries = Object.entries(fields)
    .filter(([, value]) => value !== undefined);

  if (updateEntries.length === 0) {
    return null;
  }

  const columns = updateEntries.map(([key]) => `${key} = ?`).join(', ');
  const values = updateEntries.map(([, value]) => value);
  values.push(id);

  return {
    sql: `UPDATE ${table} SET ${columns} WHERE id = ?`,
    values,
  };
}

// Projects
router.get('/projects', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM projects ORDER BY display_order ASC, created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Erreur récupération projets admin:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des projets.' });
  }
});

router.post('/projects', async (req, res) => {
  const title = sanitizeInput(req.body.title || '');
  const description = sanitizeInput(req.body.description || '');
  const technologies = sanitizeInput(req.body.technologies || '');
  const github_link = sanitizeInput(req.body.github_link || '');
  const live_link = sanitizeInput(req.body.live_link || '');
  const image_url = sanitizeInput(req.body.image_url || '');
  const display_order = parseInteger(req.body.display_order, 0);

  if (!title || !description || !technologies) {
    return res.status(400).json({ error: 'Titre, description et technologies sont requis.' });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO projects (title, description, technologies, github_link, live_link, image_url, display_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title, description, technologies, github_link || '', live_link || '', image_url || '', display_order]
    );

    const [rows] = await db.query('SELECT * FROM projects WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Erreur création projet admin:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la création du projet.' });
  }
});

router.put('/projects/:id', async (req, res) => {
  const { id } = req.params;
  const update = buildUpdateQuery('projects', id, {
    title: sanitizeInput(req.body.title),
    description: sanitizeInput(req.body.description),
    technologies: sanitizeInput(req.body.technologies),
    github_link: sanitizeInput(req.body.github_link),
    live_link: sanitizeInput(req.body.live_link),
    image_url: sanitizeInput(req.body.image_url),
    display_order: parseInteger(req.body.display_order, undefined),
  });

  if (!update) {
    return res.status(400).json({ error: 'Aucune donnée fournie pour la mise à jour.' });
  }

  try {
    const [result] = await db.query(update.sql, update.values);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Projet introuvable.' });
    }

    const [rows] = await db.query('SELECT * FROM projects WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (error) {
    console.error('Erreur mise à jour projet admin:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour du projet.' });
  }
});

router.delete('/projects/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM projects WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Projet introuvable.' });
    }
    res.json({ message: 'Projet supprimé avec succès.' });
  } catch (error) {
    console.error('Erreur suppression projet admin:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la suppression du projet.' });
  }
});

// Settings
router.get('/settings', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT setting_key, setting_value FROM settings');
    const settings = {};
    rows.forEach((row) => {
      settings[row.setting_key] = row.setting_value;
    });
    res.json(settings);
  } catch (error) {
    console.error('Erreur récupération paramètres admin:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des paramètres.' });
  }
});

router.put('/settings', async (req, res) => {
  const { settings } = req.body;
  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ error: 'Un objet settings est requis.' });
  }

  const entries = Object.entries(settings)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => [key, value]);

  if (entries.length === 0) {
    return res.status(400).json({ error: 'Aucun paramètre à enregistrer.' });
  }

  try {
    await db.query(
      'INSERT INTO settings (setting_key, setting_value) VALUES ? ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)',
      [entries]
    );

    const [rows] = await db.query('SELECT setting_key, setting_value FROM settings');
    const refreshed = {};
    rows.forEach((row) => {
      refreshed[row.setting_key] = row.setting_value;
    });

    res.json(refreshed);
  } catch (error) {
    console.error('Erreur mise à jour paramètres admin:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour des paramètres.' });
  }
});

// Chatbot questions
router.get('/chatbot-questions', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM chatbot_questions ORDER BY display_order ASC');
    res.json(rows);
  } catch (error) {
    console.error('Erreur récupération questions chatbot admin:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des questions chatbot.' });
  }
});

router.post('/chatbot-questions', async (req, res) => {
  const question = sanitizeInput(req.body.question || '');
  const answer = sanitizeInput(req.body.answer || '');
  const is_active = !!req.body.is_active;
  const display_order = parseInteger(req.body.display_order, 0);

  if (!question || !answer) {
    return res.status(400).json({ error: 'Question et réponse sont requises.' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO chatbot_questions (question, answer, is_active, display_order) VALUES (?, ?, ?, ?)',
      [question, answer, !!is_active, display_order]
    );
    const [rows] = await db.query('SELECT * FROM chatbot_questions WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Erreur création question chatbot admin:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la création de la question chatbot.' });
  }
});

router.put('/chatbot-questions/:id', async (req, res) => {
  const { id } = req.params;
  const update = buildUpdateQuery('chatbot_questions', id, {
    question: sanitizeInput(req.body.question),
    answer: sanitizeInput(req.body.answer),
    is_active: req.body.is_active === undefined ? undefined : !!req.body.is_active,
    display_order: req.body.display_order === undefined ? undefined : parseInteger(req.body.display_order, undefined),
  });

  if (!update) {
    return res.status(400).json({ error: 'Aucune donnée fournie pour la mise à jour.' });
  }

  try {
    const [result] = await db.query(update.sql, update.values);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Question chatbot introuvable.' });
    }
    const [rows] = await db.query('SELECT * FROM chatbot_questions WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (error) {
    console.error('Erreur mise à jour question chatbot admin:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour de la question chatbot.' });
  }
});

router.delete('/chatbot-questions/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM chatbot_questions WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Question chatbot introuvable.' });
    }
    res.json({ message: 'Question chatbot supprimée avec succès.' });
  } catch (error) {
    console.error('Erreur suppression question chatbot admin:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la suppression de la question chatbot.' });
  }
});

// Galerie
router.get('/gallery', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM gallery_images ORDER BY display_order ASC, created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Erreur récupération galerie admin:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération de la galerie.' });
  }
});

router.post('/gallery', async (req, res) => {
  const title = sanitizeInput(req.body.title || '');
  const image_url = sanitizeInput(req.body.image_url || '');
  const display_order = parseInteger(req.body.display_order, 0);

  if (!image_url) {
    return res.status(400).json({ error: 'Le champ image_url est requis.' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO gallery_images (title, image_url, display_order) VALUES (?, ?, ?)',
      [title, image_url, display_order]
    );
    const [rows] = await db.query('SELECT * FROM gallery_images WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Erreur création image galerie admin:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la création de l\'image de la galerie.' });
  }
});

router.put('/gallery/:id', async (req, res) => {
  const { id } = req.params;
  const update = buildUpdateQuery('gallery_images', id, {
    title: sanitizeInput(req.body.title),
    image_url: sanitizeInput(req.body.image_url),
    display_order: req.body.display_order === undefined ? undefined : parseInteger(req.body.display_order, undefined),
  });

  if (!update) {
    return res.status(400).json({ error: 'Aucune donnée fournie pour la mise à jour.' });
  }

  try {
    const [result] = await db.query(update.sql, update.values);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Image de galerie introuvable.' });
    }
    const [rows] = await db.query('SELECT * FROM gallery_images WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (error) {
    console.error('Erreur mise à jour image galerie admin:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour de l\'image de la galerie.' });
  }
});

router.delete('/gallery/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM gallery_images WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Image de galerie introuvable.' });
    }
    res.json({ message: 'Image de galerie supprimée avec succès.' });
  } catch (error) {
    console.error('Erreur suppression image galerie admin:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la suppression de l\'image de la galerie.' });
  }
});

// Messages
router.get('/messages', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM messages ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Erreur récupération messages admin:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des messages.' });
  }
});

router.put('/messages/:id/read', async (req, res) => {
  const { id } = req.params;
  const is_read = req.body.is_read === undefined ? true : !!req.body.is_read;

  try {
    const [result] = await db.query('UPDATE messages SET is_read = ? WHERE id = ?', [is_read ? 1 : 0, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Message introuvable.' });
    }

    const [rows] = await db.query('SELECT * FROM messages WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (error) {
    console.error('Erreur mise à jour message admin:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour du message.' });
  }
});

router.delete('/messages/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM messages WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Message introuvable.' });
    }
    res.json({ message: 'Message supprimé avec succès.' });
  } catch (error) {
    console.error('Erreur suppression message admin:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la suppression du message.' });
  }
});

router.put('/profile', async (req, res) => {
  const username = sanitizeInput(req.body.username || '');
  const password = req.body.password || '';
  const userId = req.user.id;
  const updateFields = {};

  if (username) {
    updateFields.username = username;
  }

  if (password) {
    if (!isStrongPassword(password)) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères.' });
    }
    updateFields.password = await bcrypt.hash(password, 12);
  }

  if (Object.keys(updateFields).length === 0) {
    return res.status(400).json({ error: 'Aucune donnée fournie pour la mise à jour du profil.' });
  }

  const update = buildUpdateQuery('users', userId, updateFields);
  if (!update) {
    return res.status(400).json({ error: 'Aucune donnée fournie pour la mise à jour du profil.' });
  }

  try {
    const [result] = await db.query(update.sql, update.values);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Utilisateur introuvable.' });
    }
    res.json({ message: 'Profil mis à jour avec succès.' });
  } catch (error) {
    console.error('Erreur mise à jour profil admin:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Le nom d\'utilisateur est déjà utilisé.' });
    }
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour du profil.' });
  }
});

module.exports = router;
