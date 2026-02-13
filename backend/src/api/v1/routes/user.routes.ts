import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { supabaseAuth } from '../../../shared/middlewares/auth';
import { validateRequest } from '../../../shared/middlewares/validateRequest';
import { updateProfileSchema } from '../validators/user.validator';

const router = Router();

// All user routes require authentication
router.use(supabaseAuth);

/**
 * @swagger
 * /api/v1/user/profile:
 *   get:
 *     summary: Get user profile
 *     description: Retrieve the authenticated user's profile information
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       401:
 *         description: Unauthorized
 */
router.get('/profile', UserController.getProfile);

/**
 * @swagger
 * /api/v1/user/profile:
 *   patch:
 *     summary: Update user profile
 *     description: Update the authenticated user's profile information
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.patch('/profile', validateRequest(updateProfileSchema), UserController.updateProfile);

/**
 * @swagger
 * /api/v1/user/virtual-address:
 *   get:
 *     summary: Get virtual address
 *     description: Retrieve the user's assigned virtual warehouse address
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Virtual address retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/virtual-address', UserController.getVirtualAddress);

export default router;
