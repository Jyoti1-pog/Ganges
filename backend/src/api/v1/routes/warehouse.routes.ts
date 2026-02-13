import { Router } from 'express';
import { WarehouseController } from '../controllers/warehouse.controller';
import { supabaseAuth } from '../../../shared/middlewares/auth';
import { authorize } from '../../../shared/middlewares/roleGuard';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(supabaseAuth);
router.use(authorize([UserRole.WAREHOUSE_ADMIN, UserRole.SUPER_ADMIN]));

router.post('/package-received', WarehouseController.receivePackage);
router.post('/package/:id/photos', WarehouseController.uploadPhotos);
router.post('/package/:id/inspect', WarehouseController.inspect);
router.post('/package/:id/locker', WarehouseController.moveToLocker);
router.get('/packages', WarehouseController.listPackages);

export default router;
