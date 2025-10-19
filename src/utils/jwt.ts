import { env } from '../config/env';
import jwt, { SignOptions } from 'jsonwebtoken';

export interface JWTPayload {
  sub: string;
  perfil: 'admin' | 'DIRETOR' | 'ADJUNTO' | 'GERENTE DE PROJETO';
  unidadeCodigo?: string;
  regioes?: string[];
}

export function signAccessToken(payload: JWTPayload): string {
  // converte string numérica para number (ex: "3600" -> 3600)
  const expiresIn: SignOptions['expiresIn'] =
    /^\d+$/.test(env.JWT_EXPIRES_IN)
      ? Number(env.JWT_EXPIRES_IN)
      : (env.JWT_EXPIRES_IN as any); // string tipo "15m", "1h", etc.

  const options: SignOptions = { expiresIn };

  return jwt.sign(payload, env.JWT_SECRET as jwt.Secret, options);
}
