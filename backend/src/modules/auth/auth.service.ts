import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../core/database/prisma';
import { env } from '../../core/config/env';
import { UnauthorizedError, BadRequestError } from '../../core/errors';

import { UserRole } from '@prisma/client';

interface TokenPayload {
    userId: string;
    email: string;
    role: UserRole;
}

export class AuthService {
    /**
     * Register a new user
     */
    static async register(data: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        phone?: string;
        role?: 'CUSTOMER' | 'DRIVER';
    }) {
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existingUser) {
            throw new BadRequestError('Email already registered');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(data.password, 12);

        // Create user and profile in transaction
        const user = await prisma.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                role: data.role || 'CUSTOMER',
                profile: {
                    create: {
                        firstName: data.firstName,
                        lastName: data.lastName,
                        phone: data.phone,
                    },
                },
            },
            include: {
                profile: true,
            },
        });

        // Generate tokens
        const { accessToken, refreshToken } = await this.generateTokens({
            userId: user.id,
            email: user.email,
            role: user.role,
        });

        return {
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                profile: user.profile,
            },
            accessToken,
            refreshToken,
        };
    }

    /**
     * Login user
     */
    static async login(email: string, password: string) {
        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
            include: { profile: true },
        });

        if (!user || !user.isActive) {
            throw new UnauthorizedError('Invalid credentials');
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            throw new UnauthorizedError('Invalid credentials');
        }

        // Generate tokens
        const { accessToken, refreshToken } = await this.generateTokens({
            userId: user.id,
            email: user.email,
            role: user.role,
        });

        return {
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                profile: user.profile,
            },
            accessToken,
            refreshToken,
        };
    }

    /**
     * Refresh access token
     */
    static async refreshAccessToken(refreshToken: string) {
        try {
            // Verify refresh token
            const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as TokenPayload;

            // Check if token exists and is not revoked
            const storedToken = await prisma.refreshToken.findUnique({
                where: { token: refreshToken },
                include: { user: true },
            });

            if (!storedToken || storedToken.revoked || storedToken.expiresAt < new Date()) {
                throw new UnauthorizedError('Invalid refresh token');
            }

            // Generate new access token
            const accessToken = this.generateAccessToken({
                userId: decoded.userId,
                email: decoded.email,
                role: decoded.role,
            });

            return { accessToken };
        } catch (error) {
            throw new UnauthorizedError('Invalid refresh token');
        }
    }

    /**
     * Logout user (revoke refresh token)
     */
    static async logout(refreshToken: string) {
        await prisma.refreshToken.updateMany({
            where: { token: refreshToken },
            data: { revoked: true },
        });
    }

    /**
     * Generate access and refresh tokens
     */
    private static async generateTokens(payload: TokenPayload) {
        const accessToken = this.generateAccessToken(payload);
        const refreshToken = this.generateRefreshToken(payload);

        // Store refresh token
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: payload.userId,
                expiresAt,
            },
        });

        return { accessToken, refreshToken };
    }

    /**
     * Generate JWT access token (15 minutes)
     */
    private static generateAccessToken(payload: TokenPayload): string {
        return jwt.sign(payload, env.JWT_SECRET, {
            expiresIn: '15m',
        });
    }

    /**
     * Generate JWT refresh token (7 days)
     */
    private static generateRefreshToken(payload: TokenPayload): string {
        return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
            expiresIn: '7d',
        });
    }

    /**
     * Verify JWT token
     */
    static verifyAccessToken(token: string): TokenPayload {
        try {
            return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
        } catch (error) {
            throw new UnauthorizedError('Invalid or expired token');
        }
    }
}
