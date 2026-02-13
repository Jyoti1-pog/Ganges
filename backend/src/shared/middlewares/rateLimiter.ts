import { rateLimit } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redis } from '../../infrastructure/redis';
import { env } from '../../core/config/env';

export const apiRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    store: new RedisStore({
        // @ts-expect-error - Known issue with types in rate-limit-redis
        sendCommand: (...args: string[]) => redis.call(...args),
    }),
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            status: 'error',
            message: 'Too many requests, please try again later.',
        });
    },
    skip: (req) => env.isDevelopment, // Optional: skip in dev
});
