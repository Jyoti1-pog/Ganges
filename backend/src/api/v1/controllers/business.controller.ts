import { Response } from 'express';
import { BusinessService } from '../../../domain/services/business.service';
import { ApiResponse } from '../../../core/response';
import { AuthenticatedRequest } from '../../../shared/middlewares/auth';

export class BusinessController {
    static async applyReseller(req: AuthenticatedRequest, res: Response) {
        const app = await BusinessService.applyReseller(req.user!.id, req.body);
        return ApiResponse.success(res, app, 'Application submitted');
    }

    static async applyExporter(req: AuthenticatedRequest, res: Response) {
        const app = await BusinessService.applyExporter(req.user!.id, req.body);
        return ApiResponse.success(res, app, 'Export lead captured');
    }
}
