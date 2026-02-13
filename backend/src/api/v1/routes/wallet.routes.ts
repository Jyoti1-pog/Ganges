import { Router } from 'express';
import { WalletController } from '../controllers/wallet.controller';
import { supabaseAuth } from '../../../shared/middlewares/auth';

const router = Router();

router.use(supabaseAuth);

/**
 * @swagger
 * /api/v1/wallet:
 *   get:
 *     summary: Get wallet balance
 *     description: Retrieve the user's wallet balance and transaction history
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet info retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', WalletController.getWallet);

/**
 * @swagger
 * /api/v1/wallet/add-funds:
 *   post:
 *     summary: Add funds to wallet
 *     description: Initiate a payment to add funds to the wallet
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Payment initiated successfully
 *       400:
 *         description: Invalid amount
 */
router.post('/add-funds', WalletController.initiateAddFunds);

/**
 * @swagger
 * /api/v1/wallet/pay-shipment:
 *   post:
 *     summary: Pay for shipment
 *     description: Deduct shipment cost from wallet balance
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shipmentId
 *             properties:
 *               shipmentId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment successful
 *       400:
 *         description: Insufficient funds
 */
router.post('/pay-shipment', WalletController.payShipment);

export default router;
