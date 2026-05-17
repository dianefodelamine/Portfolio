const mysql = require('mysql2/promise');
require('dotenv').config();

// Création du pool de connexion
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test de la connexion
pool.getConnection()
  .then(connection => {
    console.log('✅ Base de données MySQL connectée avec succès.');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Erreur de connexion à la base de données :', err.message);
    if (err.code === 'ER_BAD_DB_ERROR') {
      console.error('➡️ La base de données "portfolio_db" n\'existe pas encore. Veuillez exécuter le fichier database.sql dans phpMyAdmin.');
    }
  });

module.exports = pool;
