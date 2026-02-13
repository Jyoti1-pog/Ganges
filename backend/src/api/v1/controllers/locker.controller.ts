import { Response } from 'express';
import { prisma } from '../../../core/database/prisma';
import { ApiResponse } from '../../../core/response';
import { AuthenticatedRequest } from '../../../shared/middlewares/auth';

export class LockerController {
    /**
     * GET /locker/items
     */
    static async getMyItems(req: AuthenticatedRequest, res: Response) {
        const userId = req.user!.id;

        const items = await prisma.lockerItem.findMany({
            where: {
                package: {
                    virtualAddress: {
                        userId
                    }
                }
            },
            include: {
                package: {
                    include: {
                        warehousePhotos: true
                    }
                }
            }
        });

        return ApiResponse.success(res, items);
    }

    /**
     * GET /locker/items/:id
     */
    static async getItemDetails(req: AuthenticatedRequest, res: Response) {
        const userId = req.user!.id;
        const item = await prisma.lockerItem.findFirst({
            where: {
                id: req.params.id,
                package: {
                    virtualAddress: { userId }
                }
            },
            include: {
                package: {
                    include: { warehousePhotos: true }
                }
            }
        });
        return ApiResponse.success(res, item);
    }
}
