import { prisma } from '../../core/database/prisma';

export class BusinessService {
    static async applyReseller(userId: string, data: any) {
        return prisma.resellerApplication.create({
            data: {
                userId,
                companyName: data.companyName,
                businessType: data.businessType,
                gstNumber: data.gstNumber,
                website: data.website,
            }
        });
    }

    static async applyExporter(userId: string, data: any) {
        return prisma.exporterApplication.create({
            data: {
                userId,
                companyName: data.companyName,
                exportCategories: data.exportCategories,
                iecCode: data.iecCode,
            }
        });
    }

    static async getResellerApplications() {
        return prisma.resellerApplication.findMany({ include: { user: true } });
    }

    static async approveReseller(appId: string) {
        const app = await prisma.resellerApplication.update({
            where: { id: appId },
            data: { status: 'APPROVED' }
        });

        // Upgrade user role
        await prisma.user.update({
            where: { id: app.userId },
            data: { role: 'RESELLER' }
        });

        return app;
    }
}
