const app = require('./app');
const config = require('./config/env');
const { connectDB } = require('./config/db');
const { getRedisClient } = require('./config/redis');

const startServer = async () => {
  try {
    console.log('--- Starting KalaSetu Backend API ---');

    // Initialize Database
    await connectDB();

    // Initialize Redis (or in-memory mock)
    getRedisClient();

    const server = app.listen(config.port, () => {
      console.log(`[Server] KalaSetu API listening on port ${config.port} in ${config.nodeEnv} mode`);
      console.log(`[Server] Health check available at http://localhost:${config.port}/api/health`);
    });

    // Graceful shutdown handling
    const shutdown = () => {
      console.log('[Server] Gracefully shutting down...');
      server.close(() => {
        console.log('[Server] Closed remaining connections');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('[Server] Fatal error during startup:', error);
    process.exit(1);
  }
};

startServer();
