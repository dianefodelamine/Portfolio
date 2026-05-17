const fs = require('fs');
const path = require('path');
const db = require('./config/db');

(async () => {
  try {
    const sqlPath = path.join(__dirname, 'database.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split statements by semicolon — naive but works for simple schema files
    const statements = sql
      .split(/;\s*\n/) // split on semicolon followed by newline (to avoid splitting inside lines)
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));

    console.log(`Found ${statements.length} statements (approx).`);

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      try {
        await db.query(stmt + ';');
        console.log(`OK: statement ${i + 1}`);
      } catch (err) {
        console.warn(`WARN: statement ${i + 1} failed: ${err.message}`);
      }
    }

    console.log('SQL execution completed.');
    process.exit(0);
  } catch (err) {
    console.error('Failed to execute SQL file:', err.message);
    process.exit(1);
  }
})();
