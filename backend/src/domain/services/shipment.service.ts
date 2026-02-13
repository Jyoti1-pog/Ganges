import { prisma } from '../../core/database/prisma';
import { ShipmentStatus, PackageStatus } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../../core/errors';
import { ApiResponse } from '../../core/response';

export class ShipmentService {
    /**
     * Calculate Volumetric Weight
     * Standard formula: (L * W * H) / 5000 (for kg)
     */
    static calculateVolumetricWeight(items: any[]) {
        let totalVolumetric = 0;
        items.forEach((item: any) => {
            const pkg = item.package;
            if (pkg.length && pkg.width && pkg.height) {
                totalVolumetric += (pkg.length * pkg.width * pkg.height) / 5000;
            }
        });
        return totalVolumetric;
    }

    /**
     * Create Shipment from Locker Items (Consolidation)
     */
    static async createShipment(userId: string, data: {
        lockerItemIds: string[];
        destinationCountry: string;
        destinationAddress: string;
    }) {
        if (!data.lockerItemIds.length) {
            throw new BadRequestError('At least one item is required for shipment');
        }

        // 1. Verify all items belong to the user and are in locker
        const items = await prisma.lockerItem.findMany({
            where: {
                id: { in: data.lockerItemIds },
                package: {
                    virtualAddress: { userId }
                }
            },
            include: { package: true }
        });

        if (items.length !== data.lockerItemIds.length) {
            throw new BadRequestError('One or more items are invalid or do not belong to you');
        }

        // 2. Calculate Weights
        const totalPhysicalWeight = items.reduce((sum: number, item: any) => sum + (item.package.weight || 0), 0);
        const totalVolumetricWeight = this.calculateVolumetricWeight(items);
        const chargeableWeight = Math.max(totalPhysicalWeight, totalVolumetricWeight);

        // 3. Create Shipment in DRAFT
        const shipment = await prisma.shipment.create({
            data: {
                userId,
                status: ShipmentStatus.DRAFT,
                destinationCountry: data.destinationCountry,
                destinationAddress: data.destinationAddress,
                totalWeight: totalPhysicalWeight,
                volumetricWeight: totalVolumetricWeight,
                chargeableWeight: chargeableWeight,
                items: {
                    create: items.map((item: any) => ({
                        lockerItemId: item.id
                    }))
                }
            }
        });

        // 4. Record Audit Log (Example)
        await prisma.auditLog.create({
            data: {
                userId,
                action: 'SHIPMENT_CREATED',
                entityId: shipment.id,
                entityType: 'Shipment',
                newValue: shipment as any
            }
        });

        return shipment;
    }

    /**
     * Get Shipment Quote (Mock)
     */
    static async getQuote(shipmentId: string) {
        const shipment = await prisma.shipment.findUnique({
            where: { id: shipmentId },
        });

        if (!shipment) throw new NotFoundError('Shipment not found');

        // Simple mock math: $10 base + $5 per kg chargeable weight
        const weight = Number(shipment.chargeableWeight) || 0;
        const shippingCost = 10 + (weight * 5);
        const insuranceCost = shippingCost * 0.05; // 5% insurance

        return prisma.shipment.update({
            where: { id: shipmentId },
            data: {
                shippingCost,
                insuranceCost,
                totalCost: shippingCost + insuranceCost,
            }
        });
    }

    /**
     * Get Tracking (Mock)
     */
    static async getTracking(shipmentId: string) {
        return prisma.shipment.findUnique({
            where: { id: shipmentId },
            include: { trackingEvents: true }
        });
    }
}
