import { Router } from 'express';
import userRoutes from './user.routes';
import warehouseRoutes from './warehouse.routes';
import lockerRoutes from './locker.routes';
import shipmentRoutes from './shipment.routes';
import walletRoutes from './wallet.routes';
import webhookRoutes from './webhook.routes';
import adminRoutes from './admin.routes';
import businessRoutes from './business.routes';
import opsRoutes from './ops.routes';

const router = Router();

router.use('/user', userRoutes);
router.use('/warehouse', warehouseRoutes);
router.use('/locker', lockerRoutes);
router.use('/shipments', shipmentRoutes);
router.use('/wallet', walletRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/admin', adminRoutes);
router.use('/business', businessRoutes);
router.use('/ops', opsRoutes);

export default router;
