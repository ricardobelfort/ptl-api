import { Router } from 'express';
import { router as auth } from './auth.routes';
import { router as uploads } from './uploads.routes';
import { router as indicadores } from './indicadores.routes';
import { router as logs } from './logs.routes';
import internosRouter from './internos.routes';

const r = Router();
/**
 * @openapi
 * /health:
 *   get:
 *     summary: Healthcheck
 *     responses:
 *       200:
 *         description: OK
 */
r.get('/health', (_req, res) => res.json({ ok: true }));

r.use('/auth', auth);
r.use('/uploads', uploads);
r.use('/indicadores', indicadores);
r.use('/logs', logs);
r.use('/internos', internosRouter);

export default r;
