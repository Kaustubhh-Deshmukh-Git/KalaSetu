const { getRedisClient } = require('../config/redis');
const config = require('../config/env');

const otpRateLimiter = async (req, res, next) => {
  const { phone } = req.body;

  if (!phone) {
    return next(); // Let validator catch missing phone
  }

  try {
    const redis = getRedisClient();
    const key = `rate_limit:otp:${phone}`;
    const windowSeconds = config.otp.rateLimitWindowMinutes * 60;
    const maxRequests = config.otp.rateLimitMax;

    const count = await redis.incr(key);

    if (count === 1) {
      await redis.expire(key, windowSeconds);
    }

    if (count > maxRequests) {
      const ttl = await redis.ttl(key);
      return res.status(429).json({
        success: false,
        error: `Too many OTP requests for this phone number. Please try again in ${Math.ceil(ttl / 60)} minutes.`,
        code: 'OTP_RATE_LIMIT_EXCEEDED',
        retryAfterSeconds: ttl,
      });
    }

    next();
  } catch (error) {
    console.warn('[RateLimiter] Error checking rate limit, failing open:', error.message);
    next();
  }
};

module.exports = { otpRateLimiter };
