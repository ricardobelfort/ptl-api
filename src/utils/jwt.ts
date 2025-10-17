import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export function signAccessToken(payload: object): string {
  const options: SignOptions = { expiresIn: 900 }; // 15 minutos
  return jwt.sign(payload, env.JWT_SECRET as jwt.Secret, options);
}
