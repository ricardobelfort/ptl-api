import { Request, Response, NextFunction } from 'express';
import { AccessLog } from '@/modules/logs/access-log.model';
import { User } from '@/modules/users/user.model';

export function accessLogger() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    // Capturar informações da request
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    const method = req.method;
    const path = req.originalUrl || req.url;
    
    // Override do res.json para capturar o status code e tempo de resposta
    const originalJson = res.json;
    const originalSend = res.send;
    const originalEnd = res.end;
    
    let logged = false;
    
    const logResponse = async () => {
      if (logged) return; // Evitar logs duplicados
      logged = true;
      
      const responseTime = Date.now() - startTime;
      const statusCode = res.statusCode;
      const success = statusCode < 400;
      
      // Salvar log de acesso se houver usuário autenticado
      if (req.user) {
        try {
          // Verificar se o userId é um ObjectId válido
          if (!req.user.sub || req.user.sub.length !== 24) {
            return; // Pular logging para IDs inválidos (como nos testes)
          }
          
          // Buscar dados completos do usuário
          const userData = await User.findById(req.user.sub).lean();
          
          await AccessLog.create({
            userId: req.user.sub,
            email: userData?.email || 'unknown',
            nome: userData?.nome || 'unknown',
            perfil: req.user.perfil,
            ip,
            userAgent,
            method,
            path,
            statusCode,
            responseTime,
            success
          });
        } catch (err) {
          // Apenas logar erros em ambiente de desenvolvimento
          if (process.env.NODE_ENV === 'development') {
            console.error('Erro ao salvar log de acesso:', err);
          }
        }
      }
    };
    
    res.json = function(body?: any) {
      logResponse();
      return originalJson.call(this, body);
    };
    
    res.send = function(body?: any) {
      logResponse();
      return originalSend.call(this, body);
    };
    
    res.end = function(chunk?: any, encoding?: any) {
      logResponse();
      return originalEnd.call(this, chunk, encoding);
    };
    
    next();
  };
}