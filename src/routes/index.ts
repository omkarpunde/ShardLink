import { Router } from 'express';
import { urlController } from '../controllers/url.controller';
import { rateLimitMiddleware } from '../middleware/rate-limiter';
import { config } from '../config';

const router = Router();

router.post('/api/links', rateLimitMiddleware(config.rateLimit.createLink), (req, res) => urlController.create(req, res));
router.get('/api/links/:slug', (req, res) => urlController.getInfo(req, res));
router.delete('/api/links/:slug', (req, res) => urlController.delete(req, res));
router.get('/:slug', rateLimitMiddleware(config.rateLimit.redirect), (req, res) => urlController.redirect(req, res));

export default router;
