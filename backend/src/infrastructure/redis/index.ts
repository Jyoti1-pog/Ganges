import Redis from 'ioredis';
import { env } from '../../core/config/env';
import { logger } from '../../core/logger';

export const redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
});

redis.on('connect', () => {
    logger.info('Redis connected');
});

redis.on('error', (err) => {
    logger.warn('Redis connection failed - Rate limiting and background jobs will be disabled.', { message: err.message });
});
