import { Router } from 'express';
import { SupportController, PersonalShopperController } from '../controllers/ops.controller';
import { supabaseAuth } from '../../../shared/middlewares/auth';

const router = Router();

router.use(supabaseAuth);

router.post('/tickets', SupportController.createTicket);
router.get('/tickets', SupportController.getMyTickets);

router.post('/ps/request', PersonalShopperController.createRequest);
router.get('/ps/my-requests', PersonalShopperController.getMyRequests);

export default router;
