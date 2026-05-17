// Test simple d'import de la configuration DB pour déclencher le test de connexion
require('./config/db');
setTimeout(() => { process.exit(0); }, 3000);
