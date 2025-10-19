# Endpoint de Logs de Acesso

## 📋 Resumo

Foi implementado um sistema completo de logs de acesso para monitorar atividades dos usuários no sistema PTL. O sistema inclui:

### ✅ Implementado

#### 1. **Modelo de Dados (`AccessLog`)**
- **Arquivo**: `src/modules/logs/access-log.model.ts`
- **Campos capturados**:
  - `userId` - ID do usuário
  - `email` - Email do usuário
  - `nome` - Nome do usuário
  - `perfil` - Perfil do usuário (admin, DIRETOR, etc.)
  - `ip` - Endereço IP
  - `userAgent` - User Agent do navegador
  - `method` - Método HTTP (GET, POST, etc.)
  - `path` - Endpoint acessado
  - `statusCode` - Código de status da resposta
  - `responseTime` - Tempo de resposta em ms
  - `success` - Se a requisição foi bem-sucedida
  - `timestamp` - Data/hora do acesso

#### 2. **Middleware de Logging**
- **Arquivo**: `src/middlewares/access-logger.ts`
- **Funcionalidade**: Captura automaticamente todas as requisições de usuários autenticados
- **Tratamento**: Funciona apenas para usuários autenticados, ignora requisições anônimas

#### 3. **Endpoints da API**

##### 🔍 **GET /api/v1/logs/access**
- **Acesso**: Apenas admin
- **Função**: Lista logs de acesso com paginação e filtros
- **Parâmetros**:
  - `page` - Página (padrão: 1)
  - `limit` - Itens por página (padrão: 50, máx: 500)
  - `email` - Filtrar por email
  - `perfil` - Filtrar por perfil
  - `success` - Filtrar por sucesso (true/false)
  - `method` - Filtrar por método HTTP
  - `startDate` - Data inicial (YYYY-MM-DD)
  - `endDate` - Data final (YYYY-MM-DD)

##### 📊 **GET /api/v1/logs/access/stats**
- **Acesso**: Apenas admin
- **Função**: Estatísticas dos logs de acesso
- **Dados retornados**:
  - Total de requisições
  - Requisições bem-sucedidas/falhadas
  - Taxa de sucesso
  - Usuários únicos
  - Top 10 usuários mais ativos
  - Distribuição por método HTTP
  - Distribuição por perfil
  - Tempo médio de resposta

#### 4. **Scripts de Utilidade**
- `npm run seed:access-logs` - Cria logs de exemplo
- `npm run test:logs` - Testa os logs no banco

### 🔒 Segurança

- **Acesso restrito**: Apenas usuários com perfil `admin` podem acessar os logs
- **Dados sensíveis**: Senhas e tokens não são logados
- **Performance**: Logs são salvos de forma assíncrona sem impactar a resposta

### 📊 Exemplos de Uso

#### Listar logs recentes:
```bash
GET /api/v1/logs/access?page=1&limit=20
```

#### Filtrar por usuário específico:
```bash
GET /api/v1/logs/access?email=usuario@exemplo.com
```

#### Logs de falhas:
```bash
GET /api/v1/logs/access?success=false
```

#### Estatísticas do último mês:
```bash
GET /api/v1/logs/access/stats?startDate=2025-09-01&endDate=2025-09-30
```

### 📈 Benefícios

1. **Auditoria completa** - Rastreamento de todas as ações dos usuários
2. **Análise de performance** - Monitoramento dos tempos de resposta
3. **Detecção de problemas** - Identificação rápida de falhas
4. **Métricas de uso** - Entendimento dos padrões de acesso
5. **Segurança** - Detecção de atividades suspeitas

### 🚀 Próximos Passos

Para usar no frontend:

1. **Login** como admin
2. **Requisitar** `GET /api/v1/logs/access` com token de autorização
3. **Implementar** interface para visualizar logs e estatísticas
4. **Adicionar** filtros e gráficos conforme necessário

O sistema está completamente implementado e testado! ✅