import { prisma } from '../database/prisma';

export interface LogData {
    userId: string;
    action: string;
    entity?: string;
    entityId?: string;
    metadata?: any;
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Log an administrative or system activity
 */
export const logActivity = async (data: LogData) => {
    try {
        await prisma.activityLog.create({
            data: {
                userId: data.userId,
                action: data.action,
                entity: data.entity,
                entityId: data.entityId,
                metadata: data.metadata,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
            },
        });
    } catch (error) {
        console.error('Failed to log activity:', error);
    }
};
