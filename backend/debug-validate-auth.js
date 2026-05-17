try {
  require('./routes/authRoutes');
  console.log('auth route ok');
} catch (err) {
  console.error('auth route failed:', err);
  process.exit(1);
}
