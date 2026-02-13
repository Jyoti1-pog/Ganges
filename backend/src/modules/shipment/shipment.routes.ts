import { Router } from 'express';
import { ShipmentController } from './shipment.controller';
import { authenticateJWT, requireRole } from '../../shared/middlewares/auth.middleware';
import { validateRequest } from '../../shared/middlewares/validateRequest';
import {
    createShipmentSchema,
    updateShipmentStatusSchema,
    assignDriverSchema,
} from './shipment.validator';

const router = Router();

// All routes require authentication
router.use(authenticateJWT);

router.post('/', validateRequest(createShipmentSchema), ShipmentController.createShipment);
router.get('/', ShipmentController.getShipments);
router.get('/:id', ShipmentController.getShipmentById);

// Manager/Admin only
router.patch(
    '/:id/assign',
    requireRole(['ADMIN', 'MANAGER']),
    validateRequest(assignDriverSchema),
    ShipmentController.assignDriver
);

// Driver/Manager/Admin can update status
router.patch(
    '/:id/status',
    requireRole(['ADMIN', 'MANAGER', 'DRIVER']),
    validateRequest(updateShipmentStatusSchema),
    ShipmentController.updateStatus
);

export default router;
