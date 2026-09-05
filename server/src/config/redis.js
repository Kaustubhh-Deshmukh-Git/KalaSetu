const Redis = require('ioredis');
const RedisMock = require('ioredis-mock');
const config = require('./env');

let redisClient = null;

const getRedisClient = () => {
  if (redisClient) {
    return redisClient;
  }

  if (config.redisUrl) {
    try {
      console.log(`[Redis] Connecting to Redis at ${config.redisUrl}...`);
      redisClient = new Redis(config.redisUrl, {
        maxRetriesPerRequest: 1,
        retryStrategy(times) {
          if (times > 3) {
            console.warn('[Redis] Max connection retries reached. Switching to in-memory Redis mock.');
            redisClient = new RedisMock();
            return null;
          }
          return Math.min(times * 100, 1000);
        },
      });

      redisClient.on('connect', () => {
        console.log('[Redis] Connected to external Redis server');
      });

      redisClient.on('error', (err) => {
        console.warn('[Redis] External Redis error, operating in resilient mode:', err.message);
      });
    } catch (err) {
      console.warn('[Redis] Failed to initialize external Redis, using in-memory mock:', err.message);
      redisClient = new RedisMock();
    }
  } else {
    console.log('[Redis] No REDIS_URL provided. Using in-memory Redis mock (ioredis-mock).');
    redisClient = new RedisMock();
  }

  return redisClient;
};

module.exports = { getRedisClient };
