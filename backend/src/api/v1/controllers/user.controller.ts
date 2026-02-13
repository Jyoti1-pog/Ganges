import { Response } from 'express';
import { UserService } from '../../../domain/services/user.service';
import { ApiResponse } from '../../../core/response';
import { AuthenticatedRequest } from '../../../shared/middlewares/auth';

export class UserController {
    /**
     * GET /user/profile
     */
    static async getProfile(req: AuthenticatedRequest, res: Response) {
        const profile = await UserService.getProfile(req.user!.id);
        return ApiResponse.success(res, profile);
    }

    /**
     * PATCH /user/profile
     */
    static async updateProfile(req: AuthenticatedRequest, res: Response) {
        const profile = await UserService.updateProfile(req.user!.id, req.body);
        return ApiResponse.success(res, profile, 'Profile updated successfully');
    }

    /**
     * GET /user/virtual-address
     */
    static async getVirtualAddress(req: AuthenticatedRequest, res: Response) {
        const address = await UserService.getVirtualAddress(req.user!.id);
        return ApiResponse.success(res, address);
    }
}
