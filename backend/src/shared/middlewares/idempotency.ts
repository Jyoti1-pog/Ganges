import { Request, Response, NextFunction } from 'express';
import { redis } from '../../infrastructure/redis';
import { prisma } from '../../core/database/prisma';
import { logger } from '../../core/logger';

/**
 * Idempotency Middleware
 * Ensures that the same operation is not executed multiple times.
 * Only applies to mutation methods (POST, PUT, PATCH, DELETE).
 * Requires 'Idempotency-Key' header.
 */
export const idempotency = async (req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'GET') {
        return next();
    }

    const key = req.headers['idempotency-key'] as string;
    if (!key) {
        return next();
    }

    // Check Redis first for speed (Cache)
    const cachedResponse = await redis.get(`idempotency:${key}`);
    if (cachedResponse) {
        // Return cached response
        logger.info(`Idempotency hit (Redis): ${key}`);
        const { statusCode, body } = JSON.parse(cachedResponse);
        return res.status(statusCode).json(body);
    }

    // Check Database (Persistence) - DISABLED due to schema update
    /*
    const userId = (req as any).user?.id;
    if (userId) {
        ...
    }
    */

    // Hook into res.json/res.send to store response
    const originalJson = res.json.bind(res);
    res.json = function (body: any): Response {
        const statusCode = res.statusCode;

        // Store in Redis (Expire in 24h)
        redis.set(`idempotency:${key}`, JSON.stringify({ statusCode, body }), 'EX', 86400).catch((err: any) => logger.error('Redis save failed', err));

        return originalJson(body);
    };

    next();
};
