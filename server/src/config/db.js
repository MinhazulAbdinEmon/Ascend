import mongoose from 'mongoose';

// Connects to MongoDB once at startup.
// If the database is unreachable we exit the process ("fail fast") —
// an API without its database is useless, and the host (or nodemon)
// will restart it once the problem is fixed.
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✓ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`✗ MongoDB connection failed: ${err.message}`);
    console.error('  Check MONGO_URI in server/.env (see .env.example)');
    process.exit(1);
  }
};

export default connectDB;
