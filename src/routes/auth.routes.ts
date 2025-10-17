import { Router } from 'express';
import { z } from 'zod';
import { signAccessToken } from '../utils/jwt';

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Login fake (MVP)
 *     requestBody:
 *       required: true
 *     responses:
 *       200: { description: Token }
 */
export const router = Router();

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(3)
});

router.post('/login', (req, res) => {
  const { email, password } = schema.parse(req.body);
  // MVP: validação fake. Trocar por consulta real (bcrypt + usuários)
  if (!email || !password) return res.status(401).json({ message: 'Invalid creds' });

  const token = signAccessToken({
    sub: 'user-1',
    perfil: 'admin',
  });

  res.json({ access_token: token });
});
