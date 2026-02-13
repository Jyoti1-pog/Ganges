import { Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { ForbiddenError, UnauthorizedError } from '../../core/errors';
import { AuthenticatedRequest } from './auth';

/**
 * Role-Based Access Control Guard
 * @param roles - One or more UserRoles allowed to access this route
 */
export const authorize = (roles: UserRole | UserRole[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return next(new UnauthorizedError());
        }

        const allowedRoles = Array.isArray(roles) ? roles : [roles];

        // ADMIN has access to everything
        if (req.user.role === UserRole.ADMIN) {
            return next();
        }

        if (!allowedRoles.includes(req.user.role as any)) {
            return next(new ForbiddenError(`Required role: ${allowedRoles.join(' or ')}`));
        }

        next();
    };
};
