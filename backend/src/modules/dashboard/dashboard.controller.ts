import { Response } from 'express';
import { DashboardService } from './dashboard.service';
import { ApiResponse } from '../../core/response';
import { AuthenticatedRequest } from '../../shared/middlewares/auth.middleware';

export class DashboardController {
    /**
     * @swagger
     * /api/v1/dashboard/admin:
     *   get:
     *     summary: Get admin dashboard
     *     tags: [Dashboard]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Admin dashboard data
     */
    static async getAdminDashboard(req: AuthenticatedRequest, res: Response) {
        const data = await DashboardService.getAdminDashboard();
        return ApiResponse.success(res, data, 'Admin dashboard retrieved');
    }

    /**
     * @swagger
     * /api/v1/dashboard/manager:
     *   get:
     *     summary: Get manager dashboard
     *     tags: [Dashboard]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Manager dashboard data
     */
    static async getManagerDashboard(req: AuthenticatedRequest, res: Response) {
        const data = await DashboardService.getManagerDashboard();
        return ApiResponse.success(res, data, 'Manager dashboard retrieved');
    }

    /**
     * @swagger
     * /api/v1/dashboard/driver:
     *   get:
     *     summary: Get driver dashboard
     *     tags: [Dashboard]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Driver dashboard data
     */
    static async getDriverDashboard(req: AuthenticatedRequest, res: Response) {
        const data = await DashboardService.getDriverDashboard(req.user!.userId);
        return ApiResponse.success(res, data, 'Driver dashboard retrieved');
    }

    /**
     * @swagger
     * /api/v1/dashboard/customer:
     *   get:
     *     summary: Get customer dashboard
     *     tags: [Dashboard]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Customer dashboard data
     */
    static async getCustomerDashboard(req: AuthenticatedRequest, res: Response) {
        const data = await DashboardService.getCustomerDashboard(req.user!.userId);
        return ApiResponse.success(res, data, 'Customer dashboard retrieved');
    }
}
