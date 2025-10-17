import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { env } from '@/config/env';
import { User } from '@/modules/users/user.model';
import { signAccessToken } from '@/utils/jwt';

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Login com email e senha
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string, example: "admin@ptl.gov" }
 *               password: { type: string, example: "Senha@123" }
 *     responses:
 *       200:
 *         description: Token JWT
 */
export const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

router.post('/login', async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);

  const user = await User.findOne({ email, ativo: true }).lean();
  if (!user) return res.status(401).json({ message: 'Credenciais inválidas' });

  const ok = await bcrypt.compare(password, user.senhaHash);
  if (!ok) return res.status(401).json({ message: 'Credenciais inválidas' });

  const token = signAccessToken({
    sub: String(user._id),
    perfil: user.perfil,
    unidadeCodigo: user.unidadeCodigo,
    regioes: user.regioes
  });

  res.json({
    access_token: token,
    token_type: 'Bearer',
    expires_in: env.JWT_EXPIRES_IN,
    perfil: user.perfil,
    nome: user.nome
  });
});
