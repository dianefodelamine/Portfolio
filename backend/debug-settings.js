require('dotenv').config();
const db = require('./config/db');
(async () => {
  try {
    const [rows] = await db.query('SELECT setting_key, setting_value FROM settings');
    console.log('settings', rows);
  } catch (err) {
    console.error('Erreur settings:', err);
  } finally {
    process.exit(0);
  }
})();
