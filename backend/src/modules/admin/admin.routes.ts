import { Router } from 'express';
import { AdminController } from './admin.controller';
import { authenticateJWT, requireRole } from '../../shared/middlewares/auth.middleware';

const router = Router();

// All administrative routes require ADMIN role
router.use(authenticateJWT, requireRole(['ADMIN']));

router.get('/users', AdminController.listUsers);
router.patch('/users/:id/status', AdminController.updateUserStatus);
router.get('/drivers/pending', AdminController.listPendingDrivers);
router.get('/shipments', AdminController.listAllShipments);

export default router;
