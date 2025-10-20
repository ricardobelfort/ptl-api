import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, isTokenBlacklisted } from '../utils/jwt';

type UserPerfil = "ADMIN" | "DIRETOR" | "ADJUNTO" | "GERENTE DE PROJETO";

export function auth(roles: Array<UserPerfil> = []) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token de acesso requerido' });
    }

    const token = authHeader.substring(7);

    // Verificar se o token está na blacklist
    if (isTokenBlacklisted(token)) {
      return res.status(401).json({ message: 'Token revogado' });
    }

    // Verificar e decodificar o token
    const payload = verifyAccessToken(token);
    
    if (!payload) {
      return res.status(401).json({ message: 'Token inválido ou expirado' });
    }

    // Verificar permissões
    if (roles.length && !roles.includes(payload.perfil)) {
      return res.status(403).json({ message: 'Acesso negado - privilégios insuficientes' });
    }

    req.user = payload;
    next();
  };
}
