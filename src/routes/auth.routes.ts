import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { env } from '@/config/env';
import { User } from '@/modules/users/user.model';
import { 
  signAccessToken, 
  generateRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserRefreshTokens,
  verifyAccessToken,
  addTokenToBlacklist
} from '@/utils/jwt';
import { auth } from '@/middlewares/auth';

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
 *               email: { type: string, example: "admin@ptl.local" }
 *               password: { type: string, example: "admin123" }
 *     responses:
 *       200:
 *         description: Access token e refresh token
 * /auth/refresh:
 *   post:
 *     summary: Renovar access token usando refresh token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refresh_token: { type: string }
 *     responses:
 *       200:
 *         description: Novo access token
 * /auth/logout:
 *   post:
 *     summary: Logout - revoga refresh token específico
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refresh_token: { type: string }
 *     responses:
 *       200:
 *         description: Logout realizado
 * /auth/logout-all:
 *   post:
 *     summary: Logout de todos dispositivos - revoga todos refresh tokens
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Logout global realizado
 */
export const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

router.post('/login', async (req, res) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ 
        message: 'Dados inválidos', 
        errors: parseResult.error.issues 
      });
    }
    
    const { email, password } = parseResult.data;

    const user = await User.findOne({ email, ativo: true }).lean();
    if (!user) return res.status(401).json({ message: 'Credenciais inválidas' });

    const ok = await bcrypt.compare(password, user.senhaHash);
    if (!ok) return res.status(401).json({ message: 'Credenciais inválidas' });

    // Gerar access token
    const accessToken = signAccessToken({
      sub: String(user._id),
      perfil: user.perfil,
      unidadeCodigo: user.unidadeCodigo,
      regioes: user.regioes
    });

    // Gerar refresh token
    const refreshToken = await generateRefreshToken({
      userId: String(user._id),
      deviceInfo: {
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress || 'unknown',
        deviceName: req.get('X-Device-Name') // Header opcional para nome do dispositivo
      }
    });

    res.json({
      access_token: accessToken,
      refresh_token: refreshToken.token,
      token_type: 'Bearer',
      expires_in: env.JWT_EXPIRES_IN,
      refresh_expires_in: '7d',
      perfil: user.perfil,
      nome: user.nome
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Esquema de validação para refresh
const refreshSchema = z.object({
  refresh_token: z.string().min(1)
});

// Endpoint para renovar access token
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = refreshSchema.parse(req.body);

    // Verificar refresh token
    const refreshTokenDoc = await verifyRefreshToken(refresh_token);
    if (!refreshTokenDoc) {
      return res.status(401).json({ message: 'Refresh token inválido ou expirado' });
    }

    // Buscar dados do usuário
    const user = await User.findById(refreshTokenDoc.userId).lean();
    if (!user || !user.ativo) {
      await revokeRefreshToken(refresh_token);
      return res.status(401).json({ message: 'Usuário inválido' });
    }

    // Gerar novo access token
    const accessToken = signAccessToken({
      sub: String(user._id),
      perfil: user.perfil,
      unidadeCodigo: user.unidadeCodigo,
      regioes: user.regioes
    });

    // Opcional: Rotação do refresh token (gerar novo refresh token)
    const newRefreshToken = await generateRefreshToken({
      userId: String(user._id),
      deviceInfo: refreshTokenDoc.deviceInfo
    });

    // Revogar o refresh token antigo
    await revokeRefreshToken(refresh_token);

    res.json({
      access_token: accessToken,
      refresh_token: newRefreshToken.token,
      token_type: 'Bearer',
      expires_in: env.JWT_EXPIRES_IN,
      refresh_expires_in: '7d'
    });
  } catch (error) {
    console.error('Erro no refresh:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Esquema de validação para logout
const logoutSchema = z.object({
  refresh_token: z.string().min(1)
});

// Endpoint para logout específico
router.post('/logout', auth(['admin', 'DIRETOR', 'ADJUNTO', 'GERENTE DE PROJETO']), async (req, res) => {
  try {
    const { refresh_token } = logoutSchema.parse(req.body);

    // Revogar o refresh token
    const revoked = await revokeRefreshToken(refresh_token);

    // Adicionar access token à blacklist
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const accessToken = authHeader.substring(7);
      addTokenToBlacklist(accessToken);
    }

    res.json({ 
      message: 'Logout realizado com sucesso',
      revoked 
    });
  } catch (error) {
    console.error('Erro no logout:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Endpoint para logout global (todos os dispositivos)
router.post('/logout-all', auth(['admin', 'DIRETOR', 'ADJUNTO', 'GERENTE DE PROJETO']), async (req, res) => {
  try {
    const userId = req.user!.sub;

    // Revogar todos os refresh tokens do usuário
    const revokedCount = await revokeAllUserRefreshTokens(userId);

    // Adicionar access token atual à blacklist
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const accessToken = authHeader.substring(7);
      addTokenToBlacklist(accessToken);
    }

    res.json({ 
      message: 'Logout global realizado com sucesso',
      revoked_tokens: revokedCount
    });
  } catch (error) {
    console.error('Erro no logout global:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});
