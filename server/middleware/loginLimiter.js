import rateLimit from 'express-rate-limit';

// Strict rate limiter for login endpoints
// Prevents brute-force password attacks
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // max 500 login attempts per IP per window (relaxed for local dev)
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many login attempts. Please try again after 15 minutes.'
  },
  handler: (req, res, next, options) => {
    console.warn(`[RATE LIMIT] ${new Date().toISOString()} | IP: ${req.ip} | Login rate limit exceeded for ${req.originalUrl}`);
    res.status(options.statusCode).json(options.message);
  }
});

export default loginLimiter;
