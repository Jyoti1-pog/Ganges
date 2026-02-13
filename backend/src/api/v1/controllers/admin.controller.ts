import { Response } from 'express';
import { prisma } from '../../../core/database/prisma';
import { SupportService } from '../../../domain/services/support.service';
import { PersonalShopperService } from '../../../domain/services/ps.service';
import { BusinessService } from '../../../domain/services/business.service';
import { ApiResponse } from '../../../core/response';
import { AuthenticatedRequest } from '../../../shared/middlewares/auth';

export class AdminController {
    /**
     * GET /admin/stats
     */
    static async getStats(req: AuthenticatedRequest, res: Response) {
        const [userCount, shipmentCount, packageCount, totalRevenue] = await Promise.all([
            prisma.user.count(),
            prisma.shipment.count(),
            prisma.package.count(),
            prisma.walletTransaction.aggregate({
                where: { type: 'DEPOSIT', status: 'COMPLETED' },
                _sum: { amount: true }
            })
        ]);

        return ApiResponse.success(res, {
            users: userCount,
            shipments: shipmentCount,
            packages: packageCount,
            revenue: totalRevenue._sum.amount || 0
        });
    }

    /**
     * GET /admin/audit-logs
     */
    static async getAuditLogs(req: AuthenticatedRequest, res: Response) {
        const logs = await prisma.auditLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        return ApiResponse.success(res, logs);
    }

    /**
     * GET /admin/support/tickets
     */
    static async listTickets(req: AuthenticatedRequest, res: Response) {
        const tickets = await SupportService.getAllTickets();
        return ApiResponse.success(res, tickets);
    }

    /**
     * PATCH /admin/support/tickets/:id
     */
    static async updateTicket(req: AuthenticatedRequest, res: Response) {
        const ticket = await SupportService.updateTicketStatus(req.params.id, req.body.status);
        return ApiResponse.success(res, ticket);
    }

    /**
     * GET /admin/ops/ps-requests
     */
    static async listPSRequests(req: AuthenticatedRequest, res: Response) {
        const requests = await PersonalShopperService.getAllRequests();
        return ApiResponse.success(res, requests);
    }

    /**
     * PATCH /admin/ops/ps-requests/:id
     */
    static async updatePSRequest(req: AuthenticatedRequest, res: Response) {
        const request = await PersonalShopperService.updateRequest(req.params.id, req.body);
        return ApiResponse.success(res, request);
    }

    /**
     * GET /admin/ops/resellers
     */
    static async listResellerApps(req: AuthenticatedRequest, res: Response) {
        const apps = await BusinessService.getResellerApplications();
        return ApiResponse.success(res, apps);
    }

    /**
     * POST /admin/ops/resellers/:id/approve
     */
    static async approveReseller(req: AuthenticatedRequest, res: Response) {
        const app = await BusinessService.approveReseller(req.params.id);
        return ApiResponse.success(res, app, 'Reseller approved and role upgraded');
    }
}
