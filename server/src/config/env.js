const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',
  mongoUri: process.env.MONGO_URI || '',
  redisUrl: process.env.REDIS_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'kalasetu_jwt_default_secret_key_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '30d',
  otp: {
    expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES, 10) || 5,
    rateLimitMax: parseInt(process.env.OTP_RATE_LIMIT_MAX, 10) || 5,
    rateLimitWindowMinutes: parseInt(process.env.OTP_RATE_LIMIT_WINDOW_MINUTES, 10) || 10,
  },
  credentialEncryptionKey: process.env.CREDENTIAL_ENCRYPTION_KEY || 'kalasetu_credential_key_32bytes_dev_only!',
};

module.exports = config;
