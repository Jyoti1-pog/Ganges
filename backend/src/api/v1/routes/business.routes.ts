import { Router } from 'express';
import { BusinessController } from '../controllers/business.controller';
import { supabaseAuth } from '../../../shared/middlewares/auth';

const router = Router();

router.use(supabaseAuth);

router.post('/reseller/apply', BusinessController.applyReseller);
router.post('/exporter/apply', BusinessController.applyExporter);

export default router;
