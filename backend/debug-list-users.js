require('dotenv').config();
const db = require('./config/db');

(async () => {
  try {
    const [rows] = await db.query('SELECT id, username, email FROM users');
    console.log(JSON.stringify(rows, null, 2));
  } catch (error) {
    console.error('Erreur DB:', error);
  } finally {
    process.exit(0);
  }
})();
