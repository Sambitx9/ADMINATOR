/**
 * In-Memory Zero-Cost Login Rate Limiter
 * Blocks brute-force password guessing attacks without requiring external Redis or paid proxies.
 * Window: 15 minutes (900,000 ms)
 * Max Failed Attempts: 5 per client IP / identifier
 */

const failedAttempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

// Periodically clean up expired entries every 10 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of failedAttempts.entries()) {
    if (now - record.firstAttemptAt > WINDOW_MS) {
      failedAttempts.delete(key);
    }
  }
}, 10 * 60 * 1000).unref();

export const loginRateLimiter = (req, res, next) => {
  const clientKey = req.ip || req.connection?.remoteAddress || 'unknown-client';
  const now = Date.now();
  const record = failedAttempts.get(clientKey);

  if (record) {
    if (now - record.firstAttemptAt < WINDOW_MS) {
      if (record.count >= MAX_ATTEMPTS) {
        const retryAfterSeconds = Math.ceil((WINDOW_MS - (now - record.firstAttemptAt)) / 1000);
        res.setHeader('Retry-After', retryAfterSeconds);
        return res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: `Too many login attempts. Please wait ${retryAfterSeconds} seconds before trying again.`
          }
        });
      }
    } else {
      // Window expired, reset
      failedAttempts.set(clientKey, { count: 0, firstAttemptAt: now });
    }
  }

  // Hook into response to record failure or reset on success
  const originalJson = res.json.bind(res);
  res.json = function (body) {
    if (res.statusCode === 200 && body && body.success) {
      // Successful login resets counter
      failedAttempts.delete(clientKey);
    } else if (res.statusCode === 401 || res.statusCode === 400) {
      // Failed login attempt increments counter
      const current = failedAttempts.get(clientKey) || { count: 0, firstAttemptAt: now };
      current.count += 1;
      failedAttempts.set(clientKey, current);
    }
    return originalJson(body);
  };

  next();
};

/**
 * Utility for tests to reset in-memory rate limiter state
 */
export const resetLoginRateLimiter = () => {
  failedAttempts.clear();
};
