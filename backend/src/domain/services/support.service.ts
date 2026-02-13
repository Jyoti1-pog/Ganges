import { prisma } from '../../core/database/prisma';
import { NotFoundError } from '../../core/errors';

export class SupportService {
    static async createTicket(userId: string, data: { subject: string; message: string; priority?: string }) {
        return prisma.supportTicket.create({
            data: {
                userId,
                subject: data.subject,
                message: data.message,
                priority: data.priority || 'NORMAL',
            }
        });
    }

    static async getMyTickets(userId: string) {
        return prisma.supportTicket.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
    }

    static async getAllTickets() {
        return prisma.supportTicket.findMany({
            include: { user: { select: { email: true, profile: true } } },
            orderBy: { createdAt: 'desc' }
        });
    }

    static async updateTicketStatus(ticketId: string, status: string) {
        return prisma.supportTicket.update({
            where: { id: ticketId },
            data: { status }
        });
    }
}
