import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { supabaseAuth } from '../../../shared/middlewares/auth';
import { authorize } from '../../../shared/middlewares/roleGuard';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(supabaseAuth);
router.use(authorize(UserRole.SUPER_ADMIN));

router.get('/stats', AdminController.getStats);
router.get('/audit-logs', AdminController.getAuditLogs);

// Operations Management
router.get('/support/tickets', AdminController.listTickets);
router.patch('/support/tickets/:id', AdminController.updateTicket);

router.get('/ops/ps-requests', AdminController.listPSRequests);
router.patch('/ops/ps-requests/:id', AdminController.updatePSRequest);

router.get('/ops/resellers', AdminController.listResellerApps);
router.post('/ops/resellers/:id/approve', AdminController.approveReseller);

export default router;
