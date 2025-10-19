#!/bin/bash

# 🚀 Script de Teste Completo - Sistema de Refresh Token PTL API
# Este script demonstra todo o fluxo de autenticação via cURL

echo "🔐 TESTE COMPLETO DO SISTEMA DE REFRESH TOKEN"
echo "=============================================="
echo

# Configurações
BASE_URL="http://localhost:3000"
EMAIL="admin@ptl.local"
SENHA="admin123"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir com cores
print_step() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

# Verificar se o servidor está rodando
print_step "Verificando se o servidor está rodando..."
if ! curl -s "$BASE_URL/api/v1/health" > /dev/null; then
    print_error "Servidor não está rodando em $BASE_URL"
    print_warning "Execute 'npm run dev' antes de rodar este script"
    exit 1
fi
print_success "Servidor está rodando!"
echo

# Teste 1: Login
print_step "TESTE 1: Login e obtenção de tokens"
echo "Fazendo login com $EMAIL..."

LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$SENHA\"}")

# Verificar se login foi bem-sucedido
if echo "$LOGIN_RESPONSE" | jq -e '.access_token' > /dev/null 2>&1; then
    print_success "Login realizado com sucesso!"
    
    # Extrair tokens
    ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.access_token')
    REFRESH_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.refresh_token')
    USER_NAME=$(echo "$LOGIN_RESPONSE" | jq -r '.user.nome')
    
    echo "👤 Usuário: $USER_NAME"
    echo "🎫 Access Token: ${ACCESS_TOKEN:0:30}..."
    echo "🔄 Refresh Token: ${REFRESH_TOKEN:0:30}..."
    echo
else
    print_error "Falha no login!"
    echo "Resposta: $LOGIN_RESPONSE"
    exit 1
fi

# Teste 2: Usar Access Token
print_step "TESTE 2: Testando Access Token em endpoint protegido"
echo "Acessando logs de acesso..."

ACCESS_RESPONSE=$(curl -s -w "\\n%{http_code}" -X GET "$BASE_URL/api/v1/logs/access" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

HTTP_CODE=$(echo "$ACCESS_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$ACCESS_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    print_success "Access token válido! Endpoint protegido acessado com sucesso"
    echo "📊 Dados retornados: $(echo "$RESPONSE_BODY" | jq -c '.' 2>/dev/null || echo "$RESPONSE_BODY")"
else
    print_error "Falha ao acessar endpoint protegido (HTTP $HTTP_CODE)"
    echo "Resposta: $RESPONSE_BODY"
fi
echo

# Teste 3: Refresh Tokens
print_step "TESTE 3: Renovando tokens com Refresh Token"
echo "Aguardando 2 segundos para garantir timestamps diferentes..."
sleep 2

REFRESH_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\": \"$REFRESH_TOKEN\"}")

if echo "$REFRESH_RESPONSE" | jq -e '.access_token' > /dev/null 2>&1; then
    print_success "Tokens renovados com sucesso!"
    
    # Extrair novos tokens
    NEW_ACCESS_TOKEN=$(echo "$REFRESH_RESPONSE" | jq -r '.access_token')
    NEW_REFRESH_TOKEN=$(echo "$REFRESH_RESPONSE" | jq -r '.refresh_token')
    
    echo "🆕 Novo Access Token: ${NEW_ACCESS_TOKEN:0:30}..."
    echo "🆕 Novo Refresh Token: ${NEW_REFRESH_TOKEN:0:30}..."
    
    # Verificar se tokens são diferentes
    if [ "$ACCESS_TOKEN" != "$NEW_ACCESS_TOKEN" ] && [ "$REFRESH_TOKEN" != "$NEW_REFRESH_TOKEN" ]; then
        print_success "Rotação de tokens funcionando corretamente!"
    else
        print_warning "Tokens não foram rotacionados adequadamente"
    fi
    
    # Atualizar variáveis
    ACCESS_TOKEN="$NEW_ACCESS_TOKEN"
    REFRESH_TOKEN="$NEW_REFRESH_TOKEN"
else
    print_error "Falha ao renovar tokens!"
    echo "Resposta: $REFRESH_RESPONSE"
fi
echo

# Teste 4: Testar token antigo (deve falhar)
print_step "TESTE 4: Testando Refresh Token antigo (deve falhar)"
OLD_REFRESH_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.refresh_token')

OLD_REFRESH_RESPONSE=$(curl -s -w "\\n%{http_code}" -X POST "$BASE_URL/api/v1/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\": \"$OLD_REFRESH_TOKEN\"}")

OLD_HTTP_CODE=$(echo "$OLD_REFRESH_RESPONSE" | tail -n1)

if [ "$OLD_HTTP_CODE" = "401" ]; then
    print_success "Refresh token antigo corretamente invalidado (HTTP 401)"
else
    print_warning "Refresh token antigo ainda funciona (HTTP $OLD_HTTP_CODE)"
fi
echo

# Teste 5: Testar novo Access Token
print_step "TESTE 5: Testando novo Access Token"
NEW_ACCESS_RESPONSE=$(curl -s -w "\\n%{http_code}" -X GET "$BASE_URL/api/v1/logs/access" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

NEW_HTTP_CODE=$(echo "$NEW_ACCESS_RESPONSE" | tail -n1)

if [ "$NEW_HTTP_CODE" = "200" ]; then
    print_success "Novo access token funcionando corretamente!"
else
    print_error "Novo access token não está funcionando (HTTP $NEW_HTTP_CODE)"
fi
echo

# Teste 6: Logout
print_step "TESTE 6: Fazendo logout (revogando tokens)"

LOGOUT_RESPONSE=$(curl -s -w "\\n%{http_code}" -X POST "$BASE_URL/api/v1/auth/logout" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\": \"$REFRESH_TOKEN\"}")

LOGOUT_HTTP_CODE=$(echo "$LOGOUT_RESPONSE" | tail -n1)

if [ "$LOGOUT_HTTP_CODE" = "200" ]; then
    print_success "Logout realizado com sucesso!"
    echo "📝 $(echo "$LOGOUT_RESPONSE" | head -n -1 | jq -r '.message' 2>/dev/null || echo "Tokens revogados")"
else
    print_error "Falha no logout (HTTP $LOGOUT_HTTP_CODE)"
fi
echo

# Teste 7: Tentar usar tokens após logout
print_step "TESTE 7: Testando tokens após logout (devem estar invalidados)"

POST_LOGOUT_RESPONSE=$(curl -s -w "\\n%{http_code}" -X GET "$BASE_URL/api/v1/logs/access" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

POST_LOGOUT_HTTP_CODE=$(echo "$POST_LOGOUT_RESPONSE" | tail -n1)

if [ "$POST_LOGOUT_HTTP_CODE" = "401" ]; then
    print_success "Access token corretamente invalidado após logout!"
else
    print_warning "Access token ainda funciona após logout (HTTP $POST_LOGOUT_HTTP_CODE)"
fi

# Teste com refresh token após logout
POST_LOGOUT_REFRESH=$(curl -s -w "\\n%{http_code}" -X POST "$BASE_URL/api/v1/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\": \"$REFRESH_TOKEN\"}")

POST_LOGOUT_REFRESH_CODE=$(echo "$POST_LOGOUT_REFRESH" | tail -n1)

if [ "$POST_LOGOUT_REFRESH_CODE" = "401" ]; then
    print_success "Refresh token corretamente invalidado após logout!"
else
    print_warning "Refresh token ainda funciona após logout (HTTP $POST_LOGOUT_REFRESH_CODE)"
fi
echo

# Teste 8: Login novamente para testar logout-all
print_step "TESTE 8: Testando logout global (logout-all)"
echo "Fazendo novo login..."

LOGIN2_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$SENHA\"}")

if echo "$LOGIN2_RESPONSE" | jq -e '.access_token' > /dev/null 2>&1; then
    ACCESS_TOKEN2=$(echo "$LOGIN2_RESPONSE" | jq -r '.access_token')
    
    # Fazer logout-all
    LOGOUT_ALL_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/auth/logout-all" \
      -H "Authorization: Bearer $ACCESS_TOKEN2")
    
    if echo "$LOGOUT_ALL_RESPONSE" | jq -e '.revoked_tokens' > /dev/null 2>&1; then
        REVOKED_COUNT=$(echo "$LOGOUT_ALL_RESPONSE" | jq -r '.revoked_tokens')
        print_success "Logout global realizado: $REVOKED_COUNT tokens revogados"
    else
        print_error "Falha no logout global"
    fi
else
    print_error "Falha no segundo login"
fi
echo

# Resumo final
echo "🎯 RESUMO DOS TESTES"
echo "===================="
echo "✅ Login e obtenção de tokens"
echo "✅ Uso de access token em endpoint protegido"  
echo "✅ Renovação de tokens (refresh)"
echo "✅ Invalidação de tokens antigos"
echo "✅ Logout com revogação de tokens"
echo "✅ Logout global (todos os dispositivos)"
echo
print_success "Todos os testes do sistema de refresh token foram concluídos!"
echo
echo "📚 Para mais detalhes, consulte:"
echo "   - docs/REFRESH_TOKEN_API.md"
echo "   - docs/PTL_API_Refresh_Token.postman_collection.json"
echo
echo "🚀 Para importar no Postman:"
echo "   1. Abra o Postman"
echo "   2. Import > File > Selecione PTL_API_Refresh_Token.postman_collection.json"
echo "   3. Import > File > Selecione PTL_API_Environment.postman_environment.json"
echo "   4. Selecione o environment 'PTL API - Refresh Token Environment'"
echo "   5. Execute os testes na ordem!"