import 'express';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      sub: string;
      perfil: 'admin' | 'gestor_regional' | 'gestor_unidade' | 'auditor';
      unidadeCodigo?: string;
      regioes?: string[];
    };
  }
}
