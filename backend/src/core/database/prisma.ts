import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';
import { logger } from '../logger';

declare global {
    var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient({
    log: env.isDevelopment ? ['query', 'error', 'warn'] : ['error'],
});

if (env.isDevelopment) {
    global.prisma = prisma;
}

export const connectDB = async () => {
    try {
        await prisma.$connect();
        logger.info('Database connected successfully');
    } catch (error) {
        logger.error('Database connection failed', error);
        process.exit(1);
    }
};
