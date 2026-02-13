import { Router } from 'express';
import { WebhookController } from '../controllers/webhook.controller';

const router = Router();

// Webhooks are usually not protected by Auth middleware, 
// they use provider-specific signature verification.
router.post('/stripe', WebhookController.stripeHandler);
router.post('/shiprocket', WebhookController.shiprocketHandler);

export default router;
