import { env } from '../config/env';
import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { RefreshToken, RefreshTokenDoc } from '@/modules/auth/refresh-token.model';

export interface JWTPayload {
  sub: string;
  perfil: 'admin' | 'DIRETOR' | 'ADJUNTO' | 'GERENTE DE PROJETO';
  unidadeCodigo?: string;
  regioes?: string[];
  tokenType?: 'access' | 'refresh';
}

export interface RefreshTokenData {
  userId: string;
  deviceInfo?: {
    userAgent?: string;
    ip?: string;
    deviceName?: string;
  };
}

// Blacklist em memória para tokens revogados (em produção usar Redis)
const tokenBlacklist = new Set<string>();

export function signAccessToken(payload: JWTPayload): string {
  // converte string numérica para number (ex: "3600" -> 3600)
  const expiresIn: SignOptions['expiresIn'] =
    /^\d+$/.test(env.JWT_EXPIRES_IN)
      ? Number(env.JWT_EXPIRES_IN)
      : (env.JWT_EXPIRES_IN as any); // string tipo "15m", "1h", etc.

  const options: SignOptions = { expiresIn };
  const tokenPayload = { ...payload, tokenType: 'access' };

  return jwt.sign(tokenPayload, env.JWT_SECRET as jwt.Secret, options);
}

export async function generateRefreshToken(data: RefreshTokenData): Promise<RefreshTokenDoc> {
  // Gerar token seguro
  const token = crypto.randomBytes(64).toString('hex');
  
  // Expiração configurável
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + env.JWT_REFRESH_EXPIRES_DAYS);

  // Salvar no banco
  const refreshToken = await RefreshToken.create({
    token,
    userId: data.userId,
    expiresAt,
    deviceInfo: data.deviceInfo || {}
  });

  return refreshToken;
}

export async function verifyRefreshToken(token: string): Promise<RefreshTokenDoc | null> {
  try {
    // Buscar token no banco
    const refreshToken = await RefreshToken.findOne({ 
      token, 
      isRevoked: false 
    });

    if (!refreshToken || !refreshToken.isValid()) {
      return null;
    }

    // Atualizar lastUsed
    refreshToken.lastUsed = new Date();
    await refreshToken.save();

    return refreshToken;
  } catch (error) {
    return null;
  }
}

export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    // Verificar se o token não está na blacklist
    if (tokenBlacklist.has(token)) {
      return null;
    }

    const payload = jwt.verify(token, env.JWT_SECRET) as JWTPayload;
    
    // Verificar se é um access token
    if (payload.tokenType !== 'access') {
      return null;
    }

    return payload;
  } catch (error) {
    return null;
  }
}

export async function revokeRefreshToken(token: string): Promise<boolean> {
  try {
    const refreshToken = await RefreshToken.findOne({ token });
    
    if (refreshToken) {
      await refreshToken.revoke();
      return true;
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

export async function revokeAllUserRefreshTokens(userId: string): Promise<number> {
  try {
    return await RefreshToken.revokeAllForUser(userId);
  } catch (error) {
    return 0;
  }
}

export function addTokenToBlacklist(token: string): void {
  tokenBlacklist.add(token);
  
  // Limpar blacklist periodicamente (em produção usar TTL no Redis)
  if (tokenBlacklist.size > 10000) {
    tokenBlacklist.clear();
  }
}

export function isTokenBlacklisted(token: string): boolean {
  return tokenBlacklist.has(token);
}

// Função para cleanup periódico
export async function cleanupExpiredTokens(): Promise<number> {
  try {
    return await RefreshToken.cleanupExpired();
  } catch (error) {
    return 0;
  }
}
