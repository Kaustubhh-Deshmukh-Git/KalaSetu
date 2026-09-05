const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const config = require('./env');

let mongoMemoryServer = null;

const connectDB = async () => {
  try {
    let uri = config.mongoUri;

    if (!uri) {
      console.log('[DB] No MONGO_URI provided. Starting in-memory MongoDB instance (mongodb-memory-server)...');
      mongoMemoryServer = await MongoMemoryServer.create();
      uri = mongoMemoryServer.getUri();
      console.log(`[DB] In-memory MongoDB running at: ${uri}`);
    }

    await mongoose.connect(uri);
    console.log(`[DB] MongoDB connected successfully to ${mongoose.connection.host}`);
  } catch (error) {
    console.error('[DB] Primary MongoDB connection error:', error.message);
    if (!mongoMemoryServer) {
      console.log('[DB] Falling back to in-memory MongoDB server...');
      try {
        mongoMemoryServer = await MongoMemoryServer.create();
        const fallbackUri = mongoMemoryServer.getUri();
        await mongoose.connect(fallbackUri);
        console.log(`[DB] Fallback in-memory MongoDB connected at: ${fallbackUri}`);
      } catch (fallbackError) {
        console.error('[DB] Failed to initialize in-memory fallback:', fallbackError.message);
        throw fallbackError;
      }
    } else {
      throw error;
    }
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
    console.log('[DB] In-memory MongoDB stopped');
  }
};

module.exports = { connectDB, disconnectDB };
