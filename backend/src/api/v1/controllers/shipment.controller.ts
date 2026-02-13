import { Response } from 'express';
import { ShipmentService } from '../../../domain/services/shipment.service';
import { ApiResponse } from '../../../core/response';
import { AuthenticatedRequest } from '../../../shared/middlewares/auth';

export class ShipmentController {
    /**
     * POST /shipments
     */
    static async createShipment(req: AuthenticatedRequest, res: Response) {
        const shipment = await ShipmentService.createShipment(req.user!.id, req.body);
        return ApiResponse.created(res, shipment, 'Shipment draft created');
    }

    /**
     * POST /shipments/:id/quote
     */
    static async getQuote(req: AuthenticatedRequest, res: Response) {
        const shipment = await ShipmentService.getQuote(req.params.id);
        return ApiResponse.success(res, shipment, 'Quote generated');
    }

    /**
     * GET /shipments/:id
     */
    static async getTracking(req: AuthenticatedRequest, res: Response) {
        const shipment = await ShipmentService.getTracking(req.params.id);
        return ApiResponse.success(res, shipment);
    }

    /**
     * GET /shipments (List my shipments)
     */
    static async listMyShipments(req: AuthenticatedRequest, res: Response) {
        const { prisma } = require('../../../core/database/prisma');
        const shipments = await prisma.shipment.findMany({
            where: { userId: req.user!.id },
            orderBy: { createdAt: 'desc' }
        });
        return ApiResponse.success(res, shipments);
    }
}
