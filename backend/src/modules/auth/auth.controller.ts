import { Response } from 'express';
import { AuthService } from './auth.service';
import { ApiResponse } from '../../core/response';
import { AuthenticatedRequest } from '../../shared/middlewares/auth.middleware';

export class AuthController {
    /**
     * @swagger
     * /api/v1/auth/register:
     *   post:
     *     summary: Register a new user
     *     tags: [Auth]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - email
     *               - password
     *               - firstName
     *               - lastName
     *             properties:
     *               email:
     *                 type: string
     *               password:
     *                 type: string
     *               firstName:
     *                 type: string
     *               lastName:
     *                 type: string
     *               phone:
     *                 type: string
     *               role:
     *                 type: string
     *                 enum: [CUSTOMER, DRIVER]
     *     responses:
     *       201:
     *         description: User registered successfully
     *       400:
     *         description: Email already exists
     */
    static async register(req: any, res: Response) {
        const result = await AuthService.register(req.body);
        return ApiResponse.created(res, result, 'Registration successful');
    }

    /**
     * @swagger
     * /api/v1/auth/login:
     *   post:
     *     summary: Login user
     *     tags: [Auth]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - email
     *               - password
     *             properties:
     *               email:
     *                 type: string
     *               password:
     *                 type: string
     *     responses:
     *       200:
     *         description: Login successful
     *       401:
     *         description: Invalid credentials
     */
    static async login(req: any, res: Response) {
        const { email, password } = req.body;
        const result = await AuthService.login(email, password);
        return ApiResponse.success(res, result, 'Login successful');
    }

    /**
     * @swagger
     * /api/v1/auth/refresh:
     *   post:
     *     summary: Refresh access token
     *     tags: [Auth]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - refreshToken
     *             properties:
     *               refreshToken:
     *                 type: string
     *     responses:
     *       200:
     *         description: Token refreshed successfully
     *       401:
     *         description: Invalid refresh token
     */
    static async refresh(req: any, res: Response) {
        const { refreshToken } = req.body;
        const result = await AuthService.refreshAccessToken(refreshToken);
        return ApiResponse.success(res, result, 'Token refreshed');
    }

    /**
     * @swagger
     * /api/v1/auth/logout:
     *   post:
     *     summary: Logout user
     *     tags: [Auth]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - refreshToken
     *             properties:
     *               refreshToken:
     *                 type: string
     *     responses:
     *       200:
     *         description: Logout successful
     */
    static async logout(req: any, res: Response) {
        const { refreshToken } = req.body;
        await AuthService.logout(refreshToken);
        return ApiResponse.success(res, null, 'Logout successful');
    }

    /**
     * @swagger
     * /api/v1/auth/me:
     *   get:
     *     summary: Get current user
     *     tags: [Auth]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: User data retrieved
     *       401:
     *         description: Unauthorized
     */
    static async getMe(req: AuthenticatedRequest, res: Response) {
        return ApiResponse.success(res, req.user, 'User retrieved');
    }
}
