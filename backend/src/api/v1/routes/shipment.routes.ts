import { Router } from 'express';
import { ShipmentController } from '../controllers/shipment.controller';
import { supabaseAuth } from '../../../shared/middlewares/auth';
import { validateRequest } from '../../../shared/middlewares/validateRequest';
import { createShipmentSchema } from '../validators/shipment.validator';

const router = Router();

router.use(supabaseAuth);

/**
 * @swagger
 * /api/v1/shipments:
 *   post:
 *     summary: Create a new shipment
 *     description: Create a shipment request with package details
 *     tags: [Shipments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *               - destination
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *               destination:
 *                 type: string
 *     responses:
 *       201:
 *         description: Shipment created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post('/', validateRequest(createShipmentSchema), ShipmentController.createShipment);

/**
 * @swagger
 * /api/v1/shipments/{id}/quote:
 *   get:
 *     summary: Get shipment quote
 *     description: Calculate shipping cost for a shipment
 *     tags: [Shipments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Shipment ID
 *     responses:
 *       200:
 *         description: Quote calculated successfully
 *       404:
 *         description: Shipment not found
 */
router.get('/:id/quote', ShipmentController.getQuote);

/**
 * @swagger
 * /api/v1/shipments/{id}/tracking:
 *   get:
 *     summary: Get shipment tracking
 *     description: Retrieve tracking information for a shipment
 *     tags: [Shipments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Shipment ID
 *     responses:
 *       200:
 *         description: Tracking info retrieved successfully
 *       404:
 *         description: Shipment not found
 */
router.get('/:id/tracking', ShipmentController.getTracking);

export default router;
