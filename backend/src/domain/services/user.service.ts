import { prisma } from '../../core/database/prisma';
import { BadRequestError, NotFoundError } from '../../core/errors';
import { v4 as uuidv4 } from 'uuid';

export class UserService {
    /**
     * Get User Profile
     */
    static async getProfile(userId: string) {
        const profile = await prisma.profile.findUnique({
            where: { userId },
            include: { user: { select: { email: true, role: true, isVerified: true } } }
        });

        if (!profile) {
            throw new NotFoundError('Profile not found');
        }

        return profile;
    }

    /**
     * Create or Update Profile
     */
    static async updateProfile(userId: string, data: { firstName?: string; lastName?: string; phone?: string; avatarUrl?: string }) {
        return prisma.profile.upsert({
            where: { userId },
            update: data,
            create: {
                userId,
                firstName: data.firstName || '',
                lastName: data.lastName || '',
                phone: data.phone,
                avatarUrl: data.avatarUrl,
            },
        });
    }

    /**
     * Generate Virtual Address for User
     */
    static async generateVirtualAddress(userId: string) {
        // Check if user already has one
        const existing = await prisma.virtualAddress.findUnique({ where: { userId } });
        if (existing) return existing;

        // Generate unique Ganges ID: GANGES-XXXX (using a short unique suffix)
        const shortId = uuidv4().split('-')[0].toUpperCase();
        const gangesId = `GANGES-${shortId}`;

        return prisma.virtualAddress.create({
            data: {
                userId,
                gangesId,
                // Defaults from schema are used for address lines
            }
        });
    }

    /**
     * Get Virtual Address
     */
    static async getVirtualAddress(userId: string) {
        const address = await prisma.virtualAddress.findUnique({ where: { userId } });
        if (!address) {
            // Auto-generate if missing (on first access)
            return this.generateVirtualAddress(userId);
        }
        return address;
    }
}
