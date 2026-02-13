import { Response } from 'express';
import { WalletService } from '../../../domain/services/wallet.service';
import { ApiResponse } from '../../../core/response';
import { AuthenticatedRequest } from '../../../shared/middlewares/auth';
import { StripeAdapter } from '../../../infrastructure/payment/adapter';

export class WalletController {
    /**
     * GET /wallet
     */
    static async getWallet(req: AuthenticatedRequest, res: Response) {
        const wallet = await WalletService.getWallet(req.user!.id);
        return ApiResponse.success(res, wallet);
    }

    /**
     * POST /wallet/add-funds
     * Initiates a payment (Stripe intent for example)
     */
    static async initiateAddFunds(req: AuthenticatedRequest, res: Response) {
        const { amount, currency = 'USD', provider = 'stripe' } = req.body;

        const adapter = new StripeAdapter(); // Could be factory-based
        const payment = await adapter.createPaymentIntent(amount, currency, { userId: req.user!.id });

        return ApiResponse.success(res, payment, 'Payment initiated');
    }

    /**
     * POST /wallet/pay-shipment
     */
    static async payShipment(req: AuthenticatedRequest, res: Response) {
        const { shipmentId, amount } = req.body;
        const wallet = await WalletService.debitWallet(
            req.user!.id,
            amount,
            shipmentId,
            `Payment for Shipment ${shipmentId}`
        );

        // Update shipment status in background or same transaction
        // ...

        return ApiResponse.success(res, wallet, 'Shipment paid successfully');
    }
}
