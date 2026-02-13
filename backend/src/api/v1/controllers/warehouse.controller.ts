import { Response } from 'express';
import { WarehouseService } from '../../../domain/services/warehouse.service';
import { ApiResponse } from '../../../core/response';
import { AuthenticatedRequest } from '../../../shared/middlewares/auth';

export class WarehouseController {
    /**
     * POST /warehouse/package-received
     */
    static async receivePackage(req: AuthenticatedRequest, res: Response) {
        const pkg = await WarehouseService.receivePackage(req.body);
        return ApiResponse.created(res, pkg, 'Package registered successfully');
    }

    /**
     * POST /warehouse/package/:id/photos
     */
    static async uploadPhotos(req: AuthenticatedRequest, res: Response) {
        const { urls } = req.body; // In real world, this would be file upload
        await WarehouseService.addPackagePhotos(req.params.id, urls);
        return ApiResponse.success(res, null, 'Photos updated');
    }

    /**
     * POST /warehouse/package/:id/inspect
     */
    static async inspect(req: AuthenticatedRequest, res: Response) {
        const pkg = await WarehouseService.markInspected(req.params.id, req.body.notes);
        return ApiResponse.success(res, pkg, 'Package inspected');
    }

    /**
     * POST /warehouse/package/:id/locker
     */
    static async moveToLocker(req: AuthenticatedRequest, res: Response) {
        const lockerItem = await WarehouseService.allocateToLocker(req.params.id, req.body.shelfLocation);
        return ApiResponse.success(res, lockerItem, 'Package moved to locker');
    }

    /**
     * GET /warehouse/packages
     */
    static async listPackages(req: AuthenticatedRequest, res: Response) {
        const packages = await WarehouseService.listPackages(req.query);
        return ApiResponse.success(res, packages);
    }
}
