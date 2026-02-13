import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validateRequest } from '../../shared/middlewares/validateRequest';
import { authenticateJWT } from '../../shared/middlewares/auth.middleware';
import {
    registerSchema,
    loginSchema,
    refreshTokenSchema,
} from './auth.validator';

const router = Router();

router.post('/register', validateRequest(registerSchema), AuthController.register);
router.post('/login', validateRequest(loginSchema), AuthController.login);
router.post('/refresh', validateRequest(refreshTokenSchema), AuthController.refresh);
router.post('/logout', validateRequest(refreshTokenSchema), AuthController.logout);
router.get('/me', authenticateJWT, AuthController.getMe);

export default router;
