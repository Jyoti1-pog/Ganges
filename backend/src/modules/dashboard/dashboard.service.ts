import { prisma } from '../../core/database/prisma';

interface DashboardStats {
    totalShipments: number;
    activeShipments: number;
    deliveredShipments: number;
    cancelledShipments: number;
    totalRevenue: number;
}

interface ShipmentsPerDay {
    date: string;
    count: number;
}

interface TopDriver {
    id: string;
    name: string;
    deliveries: number;
    rating: number;
    earnings: number;
}

interface RevenueTrend {
    month: string;
    revenue: number;
}

interface RegionalStats {
    city: string;
    count: number;
}

interface UserGrowth {
    week: string;
    count: number;
}

export class DashboardService {
    /**
     * Admin Dashboard - Complete system overview
     */
    static async getAdminDashboard() {
        const [stats, shipmentsPerDay, topDrivers, recentActivity, revenueTrends, regionalStats, userGrowth] = await Promise.all([
            this.getShipmentStats(),
            this.getShipmentsPerDay(30),
            this.getTopDrivers(10),
            this.getRecentActivity(20),
            this.getRevenueTrends(6),
            this.getRegionalStats(),
            this.getUserGrowth(8),
        ]);

        return {
            stats,
            shipmentsPerDay,
            topDrivers,
            recentActivity,
            revenueTrends,
            regionalStats,
            userGrowth,
        };
    }

    /**
     * Manager Dashboard - Operations overview
     */
    static async getManagerDashboard() {
        const [stats, pendingShipments, activeShipments] = await Promise.all([
            this.getShipmentStats(),
            prisma.shipment.findMany({
                where: { status: 'PENDING' },
                include: { customer: { include: { profile: true } } },
                take: 10,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.shipment.findMany({
                where: { status: { in: ['ASSIGNED', 'IN_TRANSIT'] } },
                include: {
                    customer: { include: { profile: true } },
                    driver: { include: { user: { include: { profile: true } } } },
                },
                take: 10,
                orderBy: { createdAt: 'desc' },
            }),
        ]);

        return {
            stats,
            pendingShipments,
            activeShipments,
        };
    }

    /**
     * Driver Dashboard - Personal metrics
     */
    static async getDriverDashboard(userId: string) {
        const driverProfile = await prisma.driverProfile.findUnique({
            where: { userId },
        });

        if (!driverProfile) {
            return null;
        }

        const [assignedShipments, completedToday, weeklyEarnings] = await Promise.all([
            prisma.shipment.findMany({
                where: {
                    driverId: driverProfile.id,
                    status: { in: ['ASSIGNED', 'IN_TRANSIT'] },
                },
                include: { customer: { include: { profile: true } } },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.shipment.count({
                where: {
                    driverId: driverProfile.id,
                    status: 'DELIVERED',
                    actualDelivery: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    },
                },
            }),
            this.getDriverWeeklyEarnings(driverProfile.id),
        ]);

        return {
            profile: driverProfile,
            assignedShipments,
            completedToday,
            weeklyEarnings,
            onTimePercentage: driverProfile.totalDeliveries > 0
                ? (driverProfile.onTimeDeliveries / driverProfile.totalDeliveries) * 100
                : 100,
        };
    }

    /**
     * Customer Dashboard - Personal shipments
     */
    static async getCustomerDashboard(userId: string) {
        const [activeShipments, recentShipments, totalSpent] = await Promise.all([
            prisma.shipment.findMany({
                where: {
                    customerId: userId,
                    status: { in: ['PENDING', 'ASSIGNED', 'IN_TRANSIT'] },
                },
                include: { driver: { include: { user: { include: { profile: true } } } } },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.shipment.findMany({
                where: { customerId: userId },
                include: { driver: { include: { user: { include: { profile: true } } } } },
                orderBy: { createdAt: 'desc' },
                take: 10,
            }),
            prisma.shipment.aggregate({
                where: { customerId: userId, status: 'DELIVERED' },
                _sum: { totalCost: true },
            }),
        ]);

        return {
            activeShipments,
            recentShipments,
            totalSpent: totalSpent._sum.totalCost || 0,
        };
    }

    /**
     * Get shipment statistics
     */
    private static async getShipmentStats(): Promise<DashboardStats> {
        const [total, active, delivered, cancelled, revenue] = await Promise.all([
            prisma.shipment.count(),
            prisma.shipment.count({
                where: { status: { in: ['PENDING', 'ASSIGNED', 'IN_TRANSIT'] } },
            }),
            prisma.shipment.count({ where: { status: 'DELIVERED' } }),
            prisma.shipment.count({ where: { status: 'CANCELLED' } }),
            prisma.shipment.aggregate({
                where: { status: 'DELIVERED' },
                _sum: { totalCost: true },
            }),
        ]);

        return {
            totalShipments: total,
            activeShipments: active,
            deliveredShipments: delivered,
            cancelledShipments: cancelled,
            totalRevenue: revenue._sum.totalCost || 0,
        };
    }

    /**
     * Get shipments per day for the last N days
     */
    private static async getShipmentsPerDay(days: number): Promise<ShipmentsPerDay[]> {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const shipments = await prisma.shipment.groupBy({
            by: ['createdAt'],
            where: {
                createdAt: { gte: startDate },
            },
            _count: true,
        });

        // Group by date
        const grouped = shipments.reduce((acc: any, item) => {
            const date = new Date(item.createdAt).toISOString().split('T')[0];
            acc[date] = (acc[date] || 0) + item._count;
            return acc;
        }, {});

        return Object.entries(grouped).map(([date, count]) => ({
            date,
            count: count as number,
        }));
    }

    /**
     * Get top drivers by deliveries
     */
    private static async getTopDrivers(limit: number): Promise<TopDriver[]> {
        const drivers = await prisma.driverProfile.findMany({
            include: { user: { include: { profile: true } } },
            orderBy: { totalDeliveries: 'desc' },
            take: limit,
        });

        return drivers.map((driver) => ({
            id: driver.id,
            name: `${driver.user.profile?.firstName} ${driver.user.profile?.lastName}`,
            deliveries: driver.totalDeliveries,
            rating: driver.rating,
            earnings: driver.totalEarnings,
        }));
    }

    /**
     * Get recent activity logs
     */
    private static async getRecentActivity(limit: number) {
        return prisma.activityLog.findMany({
            include: { user: { include: { profile: true } } },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }

    /**
     * Get driver weekly earnings
     */
    private static async getDriverWeeklyEarnings(driverId: string): Promise<number> {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 7);

        const result = await prisma.shipment.aggregate({
            where: {
                driverId,
                status: 'DELIVERED',
                actualDelivery: { gte: weekStart },
            },
            _sum: { totalCost: true },
        });

        return result._sum.totalCost || 0;
    }

    /**
     * Get revenue trends for the last N months
     */
    private static async getRevenueTrends(months: number): Promise<RevenueTrend[]> {
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - months);

        const shipments = await prisma.shipment.findMany({
            where: {
                status: 'DELIVERED',
                actualDelivery: { gte: startDate },
            },
            select: { totalCost: true, actualDelivery: true },
        });

        const grouped = shipments.reduce((acc: any, item) => {
            if (!item.actualDelivery) return acc;
            const month = item.actualDelivery.toLocaleString('default', { month: 'short', year: '2-digit' });
            acc[month] = (acc[month] || 0) + item.totalCost;
            return acc;
        }, {});

        return Object.entries(grouped).map(([month, revenue]) => ({
            month,
            revenue: revenue as number,
        }));
    }

    /**
     * Get shipment distribution by city
     */
    private static async getRegionalStats(): Promise<RegionalStats[]> {
        const shipments = await prisma.shipment.findMany({
            select: { deliveryAddress: true },
        });

        const grouped = shipments.reduce((acc: any, item) => {
            const parts = item.deliveryAddress.split(',');
            const city = parts.length > 1 ? parts[1].trim() : 'Unknown';
            acc[city] = (acc[city] || 0) + 1;
            return acc;
        }, {});

        return Object.entries(grouped)
            .map(([city, count]) => ({ city, count: count as number }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
    }

    /**
     * Get user growth per week
     */
    private static async getUserGrowth(weeks: number): Promise<UserGrowth[]> {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - (weeks * 7));

        const users = await prisma.user.findMany({
            where: { createdAt: { gte: startDate } },
            select: { createdAt: true },
        });

        const grouped = users.reduce((acc: any, item) => {
            const date = new Date(item.createdAt);
            const weekNum = Math.ceil((new Date().getTime() - date.getTime()) / (7 * 24 * 60 * 60 * 1000));
            const weekLabel = `Week ${weekNum}`;
            acc[weekLabel] = (acc[weekLabel] || 0) + 1;
            return acc;
        }, {});

        return Object.entries(grouped).map(([week, count]) => ({
            week,
            count: count as number,
        }));
    }
}
