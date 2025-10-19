# 🔐 Sistema de Refresh Token - Guia de Testes API

Este documento explica como testar o sistema completo de refresh token usando Postman ou curl.

## 📋 Visão Geral

O sistema implementa autenticação JWT com dois tipos de tokens:
- **Access Token**: Válido por 15 minutos, usado para autenticar requisições
- **Refresh Token**: Válido por 7 dias, usado para renovar access tokens

## 🚀 Endpoints Disponíveis

### 1. Login (POST /api/v1/auth/login)
Autentica o usuário e retorna ambos os tokens.

### 2. Refresh Token (POST /api/v1/auth/refresh)
Renova os tokens usando um refresh token válido.

### 3. Logout (POST /api/v1/auth/logout)
Revoga um refresh token específico e adiciona access token ao blacklist.

### 4. Logout All (POST /api/v1/auth/logout-all)
Revoga todos os refresh tokens do usuário.

---

## 🧪 Testes no Postman

### Pré-requisitos
1. Servidor rodando: `npm run dev`
2. Usuário admin criado no banco (email: admin@ptl.local, senha: admin123)

### Teste 1: Login Completo
```http
POST {{base_url}}/api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@ptl.local",
  "password": "admin123"
}
```

**Resposta esperada (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "admin@ptl.gov",
    "nome": "Administrador",
    "perfil": "admin"
  }
}
```

**💡 Salve os tokens:**
- `access_token` → Variável `{{access_token}}`
- `refresh_token` → Variável `{{refresh_token}}`

### Teste 2: Usar Access Token
```http
GET {{base_url}}/api/v1/logs/access
Authorization: Bearer {{access_token}}
```

**Resposta esperada (200):** Lista de logs de acesso

### Teste 3: Renovar Tokens
```http
POST {{base_url}}/api/v1/auth/refresh
Content-Type: application/json

{
  "refresh_token": "{{refresh_token}}"
}
```

**Resposta esperada (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", // NOVO TOKEN
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." // NOVO TOKEN
}
```

**📝 Observações:**
- ✅ Novos tokens são gerados (rotação automática)
- ✅ Refresh token antigo é revogado automaticamente
- ✅ Access token antigo ainda funciona até expirar (15min)

### Teste 4: Logout Específico
```http
POST {{base_url}}/api/v1/auth/logout
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "refresh_token": "{{refresh_token}}"
}
```

**Resposta esperada (200):**
```json
{
  "message": "Logout realizado com sucesso"
}
```

**📝 Resultado:**
- ✅ Refresh token é revogado
- ✅ Access token vai para blacklist (não funciona mais)

### Teste 5: Logout Global
```http
POST {{base_url}}/api/v1/auth/logout-all
Authorization: Bearer {{access_token}}
```

**Resposta esperada (200):**
```json
{
  "message": "Logout realizado de todos os dispositivos",
  "revoked_tokens": 3
}
```

---

## 🔨 Testes via cURL

### 1. Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ptl.local",
    "password": "admin123"
  }' | jq '.'
```

### 2. Extrair tokens
```bash
# Salvar resposta em variáveis
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@ptl.local", "password": "admin123"}')

ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token')
REFRESH_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.refresh_token')

echo "Access Token: $ACCESS_TOKEN"
echo "Refresh Token: $REFRESH_TOKEN"
```

### 3. Usar Access Token
```bash
curl -X GET http://localhost:3000/api/v1/logs/access \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
```

### 4. Renovar Tokens
```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\": \"$REFRESH_TOKEN\"}" | jq '.'
```

### 5. Logout
```bash
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\": \"$REFRESH_TOKEN\"}" | jq '.'
```

---

## 📊 Cenários de Teste

### ✅ Cenário 1: Fluxo Normal
1. Login → Obter tokens
2. Usar access token → Sucesso
3. Refresh → Obter novos tokens
4. Usar novo access token → Sucesso

### ⚠️ Cenário 2: Token Expirado
1. Login → Obter tokens
2. Esperar 16 minutos (access token expira)
3. Usar access token → 401 Unauthorized
4. Refresh → Obter novos tokens
5. Usar novo access token → Sucesso

### ❌ Cenário 3: Refresh Token Inválido
```http
POST {{base_url}}/api/v1/auth/refresh
{
  "refresh_token": "token-invalido"
}
```
**Resposta:** `401 Unauthorized`

### 🔄 Cenário 4: Rotação de Tokens
1. Login → Tokens A
2. Refresh → Tokens B (A invalidado)
3. Tentar usar refresh token A → 401
4. Usar refresh token B → Sucesso

---

## 🛠️ Collection do Postman

### Variáveis de Ambiente
```json
{
  "base_url": "http://localhost:3000",
  "access_token": "",
  "refresh_token": ""
}
```

### Scripts de Teste Automático

**Script para Login (Tests tab):**
```javascript
// Salvar tokens automaticamente após login
if (pm.response.code === 200) {
  const response = pm.response.json();
  pm.environment.set("access_token", response.access_token);
  pm.environment.set("refresh_token", response.refresh_token);
  
  console.log("✅ Tokens salvos nas variáveis de ambiente");
}
```

**Script para Refresh (Tests tab):**
```javascript
// Atualizar tokens após refresh
if (pm.response.code === 200) {
  const response = pm.response.json();
  pm.environment.set("access_token", response.access_token);
  pm.environment.set("refresh_token", response.refresh_token);
  
  console.log("🔄 Tokens atualizados");
}
```

---

## 🚨 Códigos de Erro

| Código | Descrição | Cenário |
|--------|-----------|---------|
| `400` | Bad Request | JSON inválido, campos obrigatórios ausentes |
| `401` | Unauthorized | Credenciais inválidas, token expirado/inválido |
| `422` | Unprocessable Entity | Dados válidos mas regra de negócio falhou |
| `500` | Internal Server Error | Erro interno do servidor |

---

## 🔍 Logs e Debug

### Verificar tokens no MongoDB
```javascript
// No MongoDB Compass ou shell
db.refresh_tokens.find().pretty()
```

### Verificar logs da aplicação
```bash
# No terminal do servidor
npm run dev
# Observe os logs de cada requisição
```

### Decodificar JWT (debug)
Use https://jwt.io para decodificar e inspecionar o payload dos tokens.

---

## ✨ Dicas Avançadas

1. **Teste de Load**: Use múltiplos refresh tokens simultâneos
2. **Teste de Segurança**: Tente reutilizar refresh tokens revogados
3. **Teste de Expiração**: Configure TTL menor para testar expiração
4. **Teste de Device**: Envie diferentes User-Agents

## 📱 Exemplo de Integração Frontend

```javascript
// Exemplo de uso no frontend
class AuthService {
  async login(email, senha) {
    const response = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    });
    
    const data = await response.json();
    
    // Salvar tokens (localStorage, cookie seguro, etc)
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    
    return data;
  }
  
  async refreshTokens() {
    const refreshToken = localStorage.getItem('refresh_token');
    
    const response = await fetch('/api/v1/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken })
    });
    
    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      return data;
    } else {
      // Refresh token inválido, fazer logout
      this.logout();
      throw new Error('Session expired');
    }
  }
  
  async apiCall(url, options = {}) {
    let accessToken = localStorage.getItem('access_token');
    
    options.headers = {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`
    };
    
    let response = await fetch(url, options);
    
    // Se access token expirou, tentar refresh
    if (response.status === 401) {
      await this.refreshTokens();
      
      // Tentar novamente com novo token
      accessToken = localStorage.getItem('access_token');
      options.headers['Authorization'] = `Bearer ${accessToken}`;
      response = await fetch(url, options);
    }
    
    return response;
  }
}
```

---

**🎉 Sistema de Refresh Token implementado e documentado com sucesso!**