import { ipKeyGenerator, rateLimit } from 'express-rate-limit';

export const globalLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
	ipv6Subnet: 56, // Set to 60 or 64 to be less aggressive, or 52 or 48 to be more aggressive
})

export const forgotPasswordLimiter = rateLimit({
	windowMs: 60 * 60 * 1000,
  limit: 5,
  message: "Too many password reset requests from this IP, please try again after an hour",
	standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = ipKeyGenerator(req.ip ?? '')
    const email = req.body?.email ?? 'unknown'
    return `${ip}-${email}`
  }
})

export const resetPasswordLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
  limit: 5,
  message: "Too many password reset attempts from this IP, please try again after 15 minutes+",
	standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = ipKeyGenerator(req.ip ?? '')
    const userId = req?.body?.userId ?? 'unknownUser'
    return `${ip}-${userId}`
  }
})

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: "Too many login attempts from this IP, please try again after 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = ipKeyGenerator(req.ip ?? '')
    const identifier = req.body?.identifier ?? 'unknown'
    return `${ip}-${identifier}`
  },
  skipSuccessfulRequests: true,
});