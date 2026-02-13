import { Response } from 'express';
import { ShipmentService } from './shipment.service';
import { ApiResponse } from '../../core/response';
import { AuthenticatedRequest } from '../../shared/middlewares/auth.middleware';

export class ShipmentController {
    /**
     * @swagger
     * /api/v1/shipments:
     *   post:
     *     summary: Create a new shipment
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
     *               - pickupAddress
     *               - deliveryAddress
     *               - weight
     *             properties:
     *               pickupAddress:
     *                 type: string
     *               deliveryAddress:
     *                 type: string
     *               weight:
     *                 type: number
     *               dimensions:
     *                 type: string
     *               description:
     *                 type: string
     *     responses:
     *       201:
     *         description: Shipment created successfully
     */
    static async createShipment(req: AuthenticatedRequest, res: Response) {
        const shipment = await ShipmentService.createShipment(req.user!.userId, req.body);
        return ApiResponse.created(res, shipment, 'Shipment created successfully');
    }

    /**
     * @swagger
     * /api/v1/shipments:
     *   get:
     *     summary: Get all shipments
     *     tags: [Shipments]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: status
     *         schema:
     *           type: string
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Shipments retrieved successfully
     */
    static async getShipments(req: AuthenticatedRequest, res: Response) {
        const { status, page, limit } = req.query;
        const result = await ShipmentService.getShipments({
            userId: req.user!.userId,
            userRole: req.user!.role,
            status: status as string,
            page: page ? parseInt(page as string) : undefined,
            limit: limit ? parseInt(limit as string) : undefined,
        });
        return ApiResponse.success(res, result, 'Shipments retrieved successfully');
    }

    /**
     * @swagger
     * /api/v1/shipments/{id}:
     *   get:
     *     summary: Get shipment by ID
     *     tags: [Shipments]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Shipment retrieved successfully
     */
    static async getShipmentById(req: AuthenticatedRequest, res: Response) {
        const shipment = await ShipmentService.getShipmentById(
            req.params.id,
            req.user!.userId,
            req.user!.role
        );
        return ApiResponse.success(res, shipment, 'Shipment retrieved successfully');
    }

    /**
     * @swagger
     * /api/v1/shipments/{id}/assign:
     *   patch:
     *     summary: Assign driver to shipment
     *     tags: [Shipments]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - driverId
     *             properties:
     *               driverId:
     *                 type: string
     *     responses:
     *       200:
     *         description: Driver assigned successfully
     */
    static async assignDriver(req: AuthenticatedRequest, res: Response) {
        const shipment = await ShipmentService.assignDriver(req.params.id, req.body.driverId);
        return ApiResponse.success(res, shipment, 'Driver assigned successfully');
    }

    /**
     * @swagger
     * /api/v1/shipments/{id}/status:
     *   patch:
     *     summary: Update shipment status
     *     tags: [Shipments]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - status
     *             properties:
     *               status:
     *                 type: string
     *                 enum: [PENDING, ASSIGNED, IN_TRANSIT, DELIVERED, CANCELLED]
     *               notes:
     *                 type: string
     *               location:
     *                 type: string
     *     responses:
     *       200:
     *         description: Status updated successfully
     */
    static async updateStatus(req: AuthenticatedRequest, res: Response) {
        const { status, notes, location } = req.body;
        const shipment = await ShipmentService.updateStatus(req.params.id, status, notes, location);
        return ApiResponse.success(res, shipment, 'Status updated successfully');
    }
}
