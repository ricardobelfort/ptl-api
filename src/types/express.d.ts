import 'express';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      sub: string;
      perfil: 'ADMIN' | 'DIRETOR' | 'ADJUNTO' | 'GERENTE DE PROJETO';
      unidadeCodigo?: string;
      regioes?: string[];
    };
  }
}
