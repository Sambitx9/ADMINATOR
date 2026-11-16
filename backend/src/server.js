import app from './app.js';
import { connectDB } from './config/db.js';

// Security invariant: Verify mandatory secrets on startup
if (!process.env.JWT_SECRET) {
  console.error('[FATAL CONFIGURATION ERROR] JWT_SECRET environment variable is missing. Halting startup immediately.');
  process.exit(1);
}

if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET.length < 32) {
  console.error('[FATAL CONFIGURATION ERROR] JWT_SECRET must be at least 32 characters long in production mode. Halting startup.');
  process.exit(1);
}

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Connect to database
  await connectDB();

  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(` ADMINATOR Backend REST API Server`);
    console.log(` Tagline: SMART ADMISSIONS. ZERO CHAOS.`);
    console.log(` Mode: ${process.env.NODE_ENV === 'production' ? 'Production' : 'Development (₹0 Cost Foundation)'}`);
    console.log(` Address: http://localhost:${PORT}`);
    console.log(` Health:  http://localhost:${PORT}/api/v1/health`);
    console.log(`====================================================`);
  });
};

startServer().catch((err) => {
  console.error('[Fatal Error] Failed to start server:', err);
  process.exit(1);
});
