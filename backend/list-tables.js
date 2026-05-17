const db = require('./config/db');
(async () => {
  try {
    const [rows] = await db.query('SHOW TABLES');
    console.log('Tables trouvées :');
    rows.forEach(r => console.log(Object.values(r)[0]));
    process.exit(0);
  } catch (err) {
    console.error('Erreur list tables:', err.message);
    process.exit(1);
  }
})();
