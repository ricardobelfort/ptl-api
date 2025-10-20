// Tipos compartilhados para perfis de usuário
export type UserPerfil = 'ADMIN' | 'DIRETOR' | 'ADJUNTO' | 'GERENTE DE PROJETO';

export const PERFIS_USUARIO: UserPerfil[] = ['ADMIN', 'DIRETOR', 'ADJUNTO', 'GERENTE DE PROJETO'];

// Hierarquia de permissões (maior índice = mais permissões)
export const HIERARQUIA_PERFIS: Record<UserPerfil, number> = {
  'GERENTE DE PROJETO': 1,
  'ADJUNTO': 2,
  'DIRETOR': 3,
  'ADMIN': 4
};

// Função utilitária para verificar se um perfil tem permissão suficiente
export function temPermissao(perfilUsuario: UserPerfil, perfilMinimo: UserPerfil): boolean {
  return HIERARQUIA_PERFIS[perfilUsuario] >= HIERARQUIA_PERFIS[perfilMinimo];
}