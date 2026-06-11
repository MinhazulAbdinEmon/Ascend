// Entry point: load env vars FIRST, then connect to the DB, then listen.
import 'dotenv/config';
import app from './app.js';
import connectDB from './config/db.js';

const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET) {
  console.error('✗ JWT_SECRET is missing. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`✓ API running on http://localhost:${PORT}`);
  });
};

start();
