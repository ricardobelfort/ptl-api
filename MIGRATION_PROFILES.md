# Scripts de Migração de Perfis de Usuário

Este documento descreve os scripts disponíveis para gerenciar a migração dos perfis de usuário após a atualização do sistema.

## Contexto

O sistema foi atualizado para usar novos perfis de usuário:

### Perfis Antigos (removidos):
- `gestor_regional`
- `gestor_unidade`
- `auditor`

### Novos Perfis:
- `admin` (mantido)
- `DIRETOR`
- `ADJUNTO`
- `GERENTE DE PROJETO`

## Scripts Disponíveis

### 1. Verificar Usuários
```bash
npm run check:users
```
Verifica todos os usuários no banco e mostra a distribuição por perfil.

### 2. Validar Perfis
```bash
npm run validate:profiles
```
Verifica se existem usuários com perfis inválidos e mostra estatísticas.

### 3. Migrar Perfis
```bash
npm run migrate:user-profiles
```
Migra automaticamente usuários com perfis antigos para os novos perfis.

**Mapeamento automático:**
- `gestor_regional` → `DIRETOR`
- `gestor_unidade` → `GERENTE DE PROJETO`
- `auditor` → `ADJUNTO`

## Processo de Migração Recomendado

1. **Fazer backup do banco de dados**
   ```bash
   mongodump --db seu_banco --out backup_$(date +%Y%m%d_%H%M%S)
   ```

2. **Verificar estado atual**
   ```bash
   npm run check:users
   ```

3. **Executar migração (se necessário)**
   ```bash
   npm run migrate:user-profiles
   ```

4. **Validar resultado**
   ```bash
   npm run validate:profiles
   ```

## Notas Importantes

- ⚠️ **Sempre faça backup antes da migração**
- 🔍 Os scripts são seguros e mostram o que será alterado antes de executar
- 📊 Use `validate:profiles` regularmente para monitorar a integridade dos dados
- 🛠️ Em caso de perfis inválidos, corrija manualmente ou crie scripts específicos

## Exemplo de Uso

```bash
# Verificar estado atual
npm run check:users

# Se houver usuários com perfis antigos, migrar
npm run migrate:user-profiles

# Confirmar que tudo está correto
npm run validate:profiles
```