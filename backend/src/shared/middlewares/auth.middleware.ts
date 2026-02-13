import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../../modules/auth/auth.service';
import { UnauthorizedError, ForbiddenError } from '../../core/errors';
import { prisma } from '../../core/database/prisma';
import { UserRole } from '@prisma/client';

export interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        email: string;
        role: UserRole;
    };
}

/**
 * JWT Authentication Middleware
 */
export const authenticateJWT = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedError('No token provided');
        }

        const token = authHeader.substring(7);
        const decoded = AuthService.verifyAccessToken(token);

        // Attach user to request
        req.user = decoded;

        next();
    } catch (error) {
        next(new UnauthorizedError('Invalid or expired token'));
    }
};

/**
 * Optional JWT Authentication (doesn't fail if no token)
 */
export const optionalAuth = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const decoded = AuthService.verifyAccessToken(token);
            req.user = decoded;
        }

        next();
    } catch (error) {
        // Ignore errors for optional auth
        next();
    }
};

/**
 * Role-Based Authorization Middleware
 */
export const requireRole = (roles: string[]) => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return next(new UnauthorizedError('Authentication required'));
        }

        if (!roles.includes(req.user.role)) {
            return next(new ForbiddenError('Insufficient permissions'));
        }

        next();
    };
};

/**
 * Check if user is active
 */
export const requireActiveUser = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    if (!req.user) {
        return next(new UnauthorizedError('Authentication required'));
    }

    const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
    });

    if (!user || !user.isActive) {
        return next(new ForbiddenError('Account is inactive'));
    }

    next();
};
