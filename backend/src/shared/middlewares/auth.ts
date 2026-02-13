import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../core/config/env';
import { UnauthorizedError, ForbiddenError } from '../../core/errors';
import { prisma } from '../../core/database/prisma';
import { UserRole } from '@prisma/client';

export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: UserRole;
    };
}

/**
 * Supabase Auth Middleware
 * Verifies the JWT from the Authorization header using Supabase JWT Secret.
 */
export const supabaseAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedError('Missing or invalid authorization header');
        }

        const token = authHeader.split(' ')[1];

        // In production, we verify against Supabase JWT Secret
        // Supabase JWTs typically contain user metadata in 'user_metadata' or 'app_metadata'
        const decoded = jwt.verify(token, env.SUPABASE_JWT_SECRET) as any;

        if (!decoded || !decoded.sub) {
            throw new UnauthorizedError('Invalid token payload');
        }

        // Lookup user in our DB to get current role and details
        // This ensures our RBAC is based on our DB state, even if Supabase manages the auth.
        const user = await prisma.user.findUnique({
            where: { id: decoded.sub || decoded.id }, // decoded.sub is standard for Supabase
            select: { id: true, email: true, role: true, isVerified: true }
        });

        if (!user) {
            throw new UnauthorizedError('User not found in system');
        }

        req.user = user;
        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            return next(new UnauthorizedError('Invalid token'));
        }
        next(error);
    }
};
