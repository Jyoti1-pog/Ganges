import { Response } from 'express';
import { prisma } from '../../core/database/prisma';
import { ApiResponse } from '../../core/response';
import { AuthenticatedRequest } from '../../shared/middlewares/auth.middleware';
import { BadRequestError, NotFoundError } from '../../core/errors';
import { logActivity } from '../../core/utils/logger';

export class AdminController {
    /**
     * @swagger
     * /api/v1/admin/users:
     *   get:
     *     summary: List all users (Admin only)
     *     tags: [Admin Management]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: role
     *         schema:
     *           type: string
     *       - in: query
     *         name: isActive
     *         schema:
     *           type: boolean
     *     responses:
     *       200:
     *         description: List of users
     */
    static async listUsers(req: AuthenticatedRequest, res: Response) {
        const { role, isActive } = req.query;

        const users = await prisma.user.findMany({
            where: {
                role: role ? (role as any) : undefined,
                isActive: isActive !== undefined ? isActive === 'true' : undefined,
            },
            include: {
                profile: true,
                driverProfile: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return ApiResponse.success(res, users, 'Users retrieved successfully');
    }

    /**
     * @swagger
     * /api/v1/admin/users/{id}/status:
     *   patch:
     *     summary: Update user status (Admin only)
     *     tags: [Admin Management]
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
     *             properties:
     *               isActive:
     *                 type: boolean
     *     responses:
     *       200:
     *         description: User status updated
     */
    static async updateUserStatus(req: AuthenticatedRequest, res: Response) {
        const { id } = req.params;
        const { isActive } = req.body;

        if (isActive === undefined) {
            throw new BadRequestError('isActive status is required');
        }

        const user = await prisma.user.update({
            where: { id },
            data: { isActive },
        });

        await logActivity({
            userId: req.user!.userId,
            action: 'UPDATE_USER_STATUS',
            entity: 'User',
            entityId: id,
            metadata: { isActive },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        });

        return ApiResponse.success(res, user, `User status updated to ${isActive ? 'active' : 'inactive'}`);
    }

    /**
     * @swagger
     * /api/v1/admin/drivers/pending:
     *   get:
     *     summary: List pending driver verifications (Admin only)
     *     tags: [Admin Management]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: List of drivers needing verification
     */
    static async listPendingDrivers(req: AuthenticatedRequest, res: Response) {
        // Since we don't have a specific 'verified' column yet, 
        // we'll assume drivers without a vehiclePlate or some other criteria are pending.
        // For now, let's just list all drivers.
        const drivers = await prisma.driverProfile.findMany({
            include: { user: { include: { profile: true } } },
        });

        return ApiResponse.success(res, drivers, 'Pending drivers retrieved');
    }

    /**
     * @swagger
     * /api/v1/admin/shipments:
     *   get:
     *     summary: List all shipments with advanced filters (Admin only)
     *     tags: [Admin Management]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Global shipment list
     */
    static async listAllShipments(req: AuthenticatedRequest, res: Response) {
        const shipments = await prisma.shipment.findMany({
            include: {
                customer: { include: { profile: true } },
                driver: { include: { user: { include: { profile: true } } } },
            },
            orderBy: { createdAt: 'desc' },
        });

        return ApiResponse.success(res, shipments, 'All shipments retrieved');
    }
}
