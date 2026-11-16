import mongoose from 'mongoose';

/**
 * Connect to MongoDB instance
 * - Development: Defaults to Local MongoDB Community Server (127.0.0.1:27017/adminator_demo)
 * - Production: Requires cloud MongoDB URI (e.g., MongoDB Atlas connection string)
 * - Security: Never logs raw credentials or connection strings containing passwords
 */
export const connectDB = async () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const uri = process.env.MONGODB_URI || (isProduction ? null : 'mongodb://127.0.0.1:27017/adminator_demo');

  if (!uri) {
    console.error('[Database Error] MONGODB_URI environment variable is missing in production mode. A cloud MongoDB URI (e.g. MongoDB Atlas) is required.');
    return null;
  }

  // Security Invariant: Sanitize URI for all logs to prevent credential leakage
  const safeLogUri = uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');

  if (isProduction && (uri.includes('127.0.0.1') || uri.includes('localhost'))) {
    console.warn(`[Database Security Warning] MONGODB_URI points to localhost in production mode (${safeLogUri}). Note that cloud environments (such as Vercel or cloud containers) cannot access local machine databases without private networking.`);
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[Database] MongoDB Connected successfully: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[Database Error] Connection failed to ${safeLogUri}: ${error.message}`);
    // Do not crash server on startup so health check can report DB status
    return null;
  }
};
