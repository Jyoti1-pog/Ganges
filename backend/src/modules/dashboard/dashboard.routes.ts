import { Router } from 'express';
import { DashboardController } from './dashboard.controller';
import { authenticateJWT, requireRole } from '../../shared/middlewares/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticateJWT);

router.get('/admin', requireRole(['ADMIN']), DashboardController.getAdminDashboard);
router.get('/manager', requireRole(['MANAGER', 'ADMIN']), DashboardController.getManagerDashboard);
router.get('/driver', requireRole(['DRIVER']), DashboardController.getDriverDashboard);
router.get('/customer', requireRole(['CUSTOMER']), DashboardController.getCustomerDashboard);

export default router;
