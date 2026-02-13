import { prisma } from '../../core/database/prisma';
import { BadRequestError, NotFoundError } from '../../core/errors';

export class ShipmentService {
    /**
     * Calculate shipment cost based on weight and distance
     */
    private static calculateCost(weight: number, distance?: number): { baseCost: number; distanceCost: number; totalCost: number } {
        const baseCost = 10; // Base cost in USD
        const weightCost = weight * 2; // $2 per kg
        const distanceCost = distance ? distance * 0.5 : 0; // $0.50 per km
        const totalCost = baseCost + weightCost + distanceCost;

        return { baseCost, distanceCost, totalCost };
    }

    /**
     * Generate unique tracking number
     */
    private static generateTrackingNumber(): string {
        const prefix = 'GNG';
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `${prefix}-${timestamp}-${random}`;
    }

    /**
     * Create a new shipment
     */
    static async createShipment(customerId: string, data: {
        pickupAddress: string;
        pickupLat?: number;
        pickupLng?: number;
        deliveryAddress: string;
        deliveryLat?: number;
        deliveryLng?: number;
        weight: number;
        dimensions?: string;
        description?: string;
    }) {
        // Calculate distance if coordinates provided
        let distance: number | undefined;
        if (data.pickupLat && data.pickupLng && data.deliveryLat && data.deliveryLng) {
            distance = this.calculateDistance(
                data.pickupLat,
                data.pickupLng,
                data.deliveryLat,
                data.deliveryLng
            );
        }

        // Calculate costs
        const { baseCost, distanceCost, totalCost } = this.calculateCost(data.weight, distance);

        // Create shipment
        const shipment = await prisma.shipment.create({
            data: {
                trackingNumber: this.generateTrackingNumber(),
                customerId,
                pickupAddress: data.pickupAddress,
                pickupLat: data.pickupLat,
                pickupLng: data.pickupLng,
                deliveryAddress: data.deliveryAddress,
                deliveryLat: data.deliveryLat,
                deliveryLng: data.deliveryLng,
                weight: data.weight,
                dimensions: data.dimensions,
                description: data.description,
                baseCost,
                distanceCost,
                totalCost,
                statusHistory: {
                    create: {
                        status: 'PENDING',
                        notes: 'Shipment created',
                    },
                },
            },
            include: {
                customer: {
                    include: { profile: true },
                },
                statusHistory: true,
            },
        });

        return shipment;
    }

    /**
     * Get shipment by ID
     */
    static async getShipmentById(shipmentId: string, userId: string, userRole: string) {
        const shipment = await prisma.shipment.findUnique({
            where: { id: shipmentId },
            include: {
                customer: { include: { profile: true } },
                driver: { include: { user: { include: { profile: true } } } },
                statusHistory: { orderBy: { createdAt: 'desc' } },
            },
        });

        if (!shipment) {
            throw new NotFoundError('Shipment not found');
        }

        // Authorization check
        if (userRole === 'CUSTOMER' && shipment.customerId !== userId) {
            throw new BadRequestError('Unauthorized access to shipment');
        }

        if (userRole === 'DRIVER' && shipment.driver?.userId !== userId) {
            throw new BadRequestError('Unauthorized access to shipment');
        }

        return shipment;
    }

    /**
     * Get all shipments with filters
     */
    static async getShipments(filters: {
        userId?: string;
        userRole?: string;
        status?: string;
        page?: number;
        limit?: number;
    }) {
        const { userId, userRole, status, page = 1, limit = 10 } = filters;

        const where: any = {};

        // Role-based filtering
        if (userRole === 'CUSTOMER') {
            where.customerId = userId;
        } else if (userRole === 'DRIVER') {
            where.driver = { userId };
        }

        // Status filter
        if (status) {
            where.status = status;
        }

        const [shipments, total] = await Promise.all([
            prisma.shipment.findMany({
                where,
                include: {
                    customer: { include: { profile: true } },
                    driver: { include: { user: { include: { profile: true } } } },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.shipment.count({ where }),
        ]);

        return {
            shipments,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Assign driver to shipment
     */
    static async assignDriver(shipmentId: string, driverId: string) {
        // Check if driver exists and is available
        const driver = await prisma.driverProfile.findUnique({
            where: { id: driverId },
        });

        if (!driver || !driver.isAvailable) {
            throw new BadRequestError('Driver not available');
        }

        // Update shipment
        const shipment = await prisma.shipment.update({
            where: { id: shipmentId },
            data: {
                driverId,
                status: 'ASSIGNED',
                statusHistory: {
                    create: {
                        status: 'ASSIGNED',
                        notes: `Assigned to driver ${driver.id}`,
                    },
                },
            },
            include: {
                customer: { include: { profile: true } },
                driver: { include: { user: { include: { profile: true } } } },
            },
        });

        return shipment;
    }

    /**
     * Update shipment status
     */
    static async updateStatus(
        shipmentId: string,
        status: string,
        notes?: string,
        location?: string
    ) {
        const shipment = await prisma.shipment.update({
            where: { id: shipmentId },
            data: {
                status: status as any,
                ...(status === 'DELIVERED' && { actualDelivery: new Date() }),
                statusHistory: {
                    create: {
                        status: status as any,
                        notes,
                        location,
                    },
                },
            },
            include: {
                customer: { include: { profile: true } },
                driver: { include: { user: { include: { profile: true } } } },
                statusHistory: { orderBy: { createdAt: 'desc' } },
            },
        });

        // Update driver metrics if delivered
        if (status === 'DELIVERED' && shipment.driverId) {
            await prisma.driverProfile.update({
                where: { id: shipment.driverId },
                data: {
                    totalDeliveries: { increment: 1 },
                    totalEarnings: { increment: shipment.totalCost },
                },
            });
        }

        return shipment;
    }

    /**
     * Calculate distance between two coordinates (Haversine formula)
     */
    private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // Earth's radius in km
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) *
            Math.cos(this.toRad(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private static toRad(degrees: number): number {
        return degrees * (Math.PI / 180);
    }
}
