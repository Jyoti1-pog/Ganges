import { Router } from 'express';
import { LockerController } from '../controllers/locker.controller';
import { supabaseAuth } from '../../../shared/middlewares/auth';

const router = Router();

router.use(supabaseAuth);

router.get('/items', LockerController.getMyItems);
router.get('/items/:id', LockerController.getItemDetails);

export default router;
