import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

type UserPerfil = "admin" | "DIRETOR" | "ADJUNTO" | "GERENTE DE PROJETO";

export function auth(roles: Array<UserPerfil> = []) {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as any;
      req.user = payload;
      if (roles.length && !roles.includes(payload.perfil)) return res.status(403).json({ message: 'Forbidden' });
      next();
    } catch {
      return res.status(401).json({ message: 'Unauthorized' });
    }
  };
}
