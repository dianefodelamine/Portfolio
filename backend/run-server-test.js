// Démarre server.js puis s'arrête après 2s pour vérifier l'initialisation
require('./server');
setTimeout(() => process.exit(0), 2000);
