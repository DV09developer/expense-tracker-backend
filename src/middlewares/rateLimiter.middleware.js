// middlewares/rateLimiter.js
import { rateLimit, ipKeyGenerator } from "express-rate-limit";
const message = {
    statusCode: 429,
    message: "Too many verification attempts. Please try again later.",
    success: false,
}

// Limits OTP requests per IP - prevents spamming users with OTP emails
export const forgotPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // 3 requests per window per IP
    message,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        // Combine IP + email so one IP can't lock out everyone,
        // and one attacker can't hammer a single email from many IPs unnoticed
        const ip = ipKeyGenerator(req.ip); // or ipKeyGenerator(req), depending on your version
        const email = req.body?.email?.toLowerCase()?.trim() || "";
        return `${ip}-${email}`;
    },
});

// Limits OTP verification attempts - prevents brute-forcing the 6-digit code
export const verifyOTPLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes (matches OTP expiry)
    max: 5, // 5 attempts per window per IP+email
    message,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        const ip = ipKeyGenerator(req.ip); // or ipKeyGenerator(req), depending on your version
        const email = req.body?.email?.toLowerCase()?.trim() || "";
        return `${ip}-${email}`;
    },
});