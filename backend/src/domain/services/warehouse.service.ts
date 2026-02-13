import { prisma } from '../../core/database/prisma';
import { PackageStatus } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../../core/errors';

export class WarehouseService {
    /**
     * Register a new package received at the warehouse.
     */
    static async receivePackage(data: {
        gangesId: string;
        trackingNumber?: string;
        carrier?: string;
        weight?: number;
        dimensions?: { length: number; width: number; height: number };
        description?: string;
    }) {
        // 1. Find Virtual Address by GangesId
        const vAddress = await prisma.virtualAddress.findUnique({
            where: { gangesId: data.gangesId },
        });

        if (!vAddress) {
            throw new NotFoundError(`Ganges-ID ${data.gangesId} not found`);
        }

        // 2. Create Package
        return prisma.package.create({
            data: {
                virtualAddressId: vAddress.id,
                trackingNumber: data.trackingNumber,
                carrier: data.carrier,
                weight: data.weight,
                length: data.dimensions?.length,
                width: data.dimensions?.width,
                height: data.dimensions?.height,
                description: data.description,
                status: PackageStatus.RECEIVED,
            },
        });
    }

    /**
     * Add photos to a package
     */
    static async addPackagePhotos(packageId: string, urls: string[]) {
        const pkg = await prisma.package.findUnique({ where: { id: packageId } });
        if (!pkg) throw new NotFoundError('Package not found');

        return prisma.warehousePhoto.createMany({
            data: urls.map(url => ({ packageId, url }))
        });
    }

    /**
     * Move package to locker (Locker allocation)
     */
    static async allocateToLocker(packageId: string, shelfLocation: string) {
        return prisma.lockerItem.create({
            data: {
                packageId,
                shelfLocation,
            }
        });
    }

    /**
     * Inspect package
     */
    static async markInspected(packageId: string, notes: string) {
        return prisma.package.update({
            where: { id: packageId },
            data: {
                status: PackageStatus.INSPECTED,
                inspectionNotes: notes
            }
        });
    }

    /**
     * List all packages in warehouse (Admin)
     */
    static async listPackages(filters: any) {
        return prisma.package.findMany({
            where: filters,
            include: { warehousePhotos: true, virtualAddress: true }
        });
    }
}
