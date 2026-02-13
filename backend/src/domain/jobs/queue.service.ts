import { Queue, Worker, Job } from 'bullmq';
import { redis } from '../../infrastructure/redis';
import { logger } from '../../core/logger';
import { env } from '../../core/config/env';

// 1. Define Queues
export const emailQueue = new Queue('email-notifications', { connection: redis });
export const trackingQueue = new Queue('tracking-sync', { connection: redis });

// 2. Job Handlers (Workers)
export const setupWorkers = () => {
    // Email Worker
    new Worker('email-notifications', async (job: Job) => {
        logger.info(`Processing Email Job ${job.id}`, { data: job.data });
        // Mock Email sending
        return { sent: true };
    }, { connection: redis });

    // Tracking Sync Worker
    new Worker('tracking-sync', async (job: Job) => {
        logger.info(`Processing Tracking Sync Job ${job.id}`, { shipmentId: job.data.shipmentId });
        // Mock shipment tracking API call
        return { synced: true };
    }, { connection: redis });

    logger.info('Background Job Workers Initialized');
};

/**
 * Add Job Helpers
 */
export const addEmailJob = (to: string, subject: string, template: string, context: any) => {
    return emailQueue.add('send-email', { to, subject, template, context }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 }
    });
};
