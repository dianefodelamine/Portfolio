const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.JWT_SECRET) {
  console.error('❌ AVERTISSEMENT : JWT_SECRET n\'est pas défini dans backend/.env. Le login ne fonctionnera pas correctement.');
}

// Security & tooling
const helmet = require('helmet');
const rateLimiter = require('./middleware/rateLimiter');
const { requestLogger } = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);
app.use(requestLogger);

// Servir les fichiers statiques du frontend (dossier parent)
// Cela permet d'accéder au site directement via http://localhost:3000
const frontendPath = path.join(__dirname, '../');
app.use(express.static(frontendPath));

const fs = require('fs');
// Ensure uploads directory exists and serve it statically
const uploadsPath = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsPath)) {
  try {
    fs.mkdirSync(uploadsPath, { recursive: true });
    console.log('✅ Created uploads directory.');
  } catch (err) {
    console.error('❌ Could not create uploads directory:', err.message);
  }
}
app.use('/uploads', express.static(uploadsPath));

// Importation des routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const publicRoutes = require('./routes/publicRoutes');

// Routes API de base
app.get('/api/status', (req, res) => {
  res.json({ message: 'API Backend opérationnelle 🚀' });
});

// Routes Auth
app.use('/api/auth', authRoutes);

// Routes Admin protégées
app.use('/api/admin', adminRoutes);

// Branchement des routes publiques
app.use('/api/public', publicRoutes);

// Routes API non trouvées
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Route API introuvable.' });
});

// Importation de la configuration de la base de données pour vérifier la connexion au démarrage
require('./config/db');

app.use(errorHandler);

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
  console.log(`💻 Accédez au site public : http://localhost:${PORT}/index.html`);
  console.log(`🔒 Accédez à l'admin : http://localhost:${PORT}/admin/dashboard.html`);
  console.log(`======================================================\n`);
});
