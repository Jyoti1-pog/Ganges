import { Request, Response } from 'express';
import { ApiResponse } from '../../../core/response';
import { prisma } from '../../../core/database/prisma';
import { logger } from '../../../core/logger';
import { WalletService } from '../../../domain/services/wallet.service';

export class WebhookController {
    /**
     * POST /webhooks/stripe
     */
    static async stripeHandler(req: Request, res: Response) {
        const payload = req.body;
        const sig = req.headers['stripe-signature'];

        logger.info('Stripe Webhook Received', { type: payload.type });

        // 1. Log Raw Event
        await prisma.webhookEvent.create({
            data: {
                provider: 'STRIPE',
                eventType: payload.type,
                payload: payload as any
            }
        });

        // 2. Handle specific events
        if (payload.type === 'payment_intent.succeeded') {
            const intent = payload.data.object;
            const userId = intent.metadata.userId;
            const amount = intent.amount / 100; // Stripe uses cents

            if (userId) {
                await WalletService.creditWallet(userId, amount, intent.id, 'Stripe Deposit');
            }
        }

        return ApiResponse.success(res, { received: true });
    }

    /**
     * POST /webhooks/shiprocket
     */
    static async shiprocketHandler(req: Request, res: Response) {
        // Handle tracking updates
        logger.info('Shiprocket Webhook Received', req.body);
        return ApiResponse.success(res, { received: true });
    }
}
