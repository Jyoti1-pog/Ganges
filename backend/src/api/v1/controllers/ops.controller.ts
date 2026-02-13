import { Response } from 'express';
import { SupportService } from '../../../domain/services/support.service';
import { PersonalShopperService } from '../../../domain/services/ps.service';
import { ApiResponse } from '../../../core/response';
import { AuthenticatedRequest } from '../../../shared/middlewares/auth';

export class SupportController {
    static async createTicket(req: AuthenticatedRequest, res: Response) {
        const ticket = await SupportService.createTicket(req.user!.id, req.body);
        return ApiResponse.created(res, ticket);
    }

    static async getMyTickets(req: AuthenticatedRequest, res: Response) {
        const tickets = await SupportService.getMyTickets(req.user!.id);
        return ApiResponse.success(res, tickets);
    }
}

export class PersonalShopperController {
    static async createRequest(req: AuthenticatedRequest, res: Response) {
        const request = await PersonalShopperService.createRequest(req.user!.id, req.body);
        return ApiResponse.created(res, request);
    }

    static async getMyRequests(req: AuthenticatedRequest, res: Response) {
        const requests = await PersonalShopperService.getMyRequests(req.user!.id);
        return ApiResponse.success(res, requests);
    }
}
