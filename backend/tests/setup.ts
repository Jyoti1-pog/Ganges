import dotenv from 'dotenv';
import path from 'path';

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

process.env.NODE_ENV = 'test';

// Mock Redis
jest.mock('../src/infrastructure/redis', () => ({
    redis: {
        get: jest.fn(),
        set: jest.fn(),
        on: jest.fn(),
        call: jest.fn(),
    },
}));

// Mock Prisma
jest.mock('../src/core/database/prisma', () => ({
    prisma: {
        user: { findUnique: jest.fn(), findMany: jest.fn(), count: jest.fn() },
        profile: { findUnique: jest.fn(), update: jest.fn() },
        shipment: { findUnique: jest.fn(), findMany: jest.fn(), count: jest.fn() },
        idempotencyKey: { findUnique: jest.fn(), create: jest.fn(), upsert: jest.fn() },
        walletTransaction: { aggregate: jest.fn() },
        auditLog: { findMany: jest.fn() },
    },
}));

// Mock BullMQ
jest.mock('bullmq', () => ({
    Queue: jest.fn().mockImplementation(() => ({
        add: jest.fn(),
    })),
    Worker: jest.fn(),
}));
