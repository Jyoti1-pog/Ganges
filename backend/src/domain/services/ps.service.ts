import { prisma } from '../../core/database/prisma';
import { NotFoundError, BadRequestError } from '../../core/errors';

export class PersonalShopperService {
    static async createRequest(userId: string, data: any) {
        return prisma.personalShopperRequest.create({
            data: {
                userId,
                url: data.url,
                itemName: data.itemName,
                quantity: data.quantity,
                size: data.size,
                color: data.color,
                maxPrice: data.maxPrice,
            }
        });
    }

    static async getMyRequests(userId: string) {
        return prisma.personalShopperRequest.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
    }

    static async getAllRequests() {
        return prisma.personalShopperRequest.findMany({
            include: { user: { select: { email: true, profile: true } } },
            orderBy: { createdAt: 'desc' }
        });
    }

    static async updateRequest(requestId: string, data: { status?: string; adminQuote?: any; adminNote?: string }) {
        return prisma.personalShopperRequest.update({
            where: { id: requestId },
            data
        });
    }
}
