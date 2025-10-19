import 'express';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      sub: string;
      perfil: 'admin' | 'DIRETOR' | 'ADJUNTO' | 'GERENTE DE PROJETO';
      unidadeCodigo?: string;
      regioes?: string[];
    };
  }
}
