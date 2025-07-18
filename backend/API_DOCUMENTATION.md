# MILAPP Backend API Documentation

## Visão Geral

A API do MILAPP Backend é uma aplicação FastAPI que fornece endpoints para gerenciamento de projetos RPA, automação de processos e integração com IA.

**Versão:** 2.0.0  
**Base URL:** `http://localhost:8000`  
**Documentação Interativa:** `/docs` (Swagger UI)  
**Documentação Alternativa:** `/redoc` (ReDoc)

## Autenticação

A API utiliza autenticação JWT (JSON Web Tokens) com Bearer token.

### Endpoints de Autenticação

#### POST /api/v1/auth/login
Autentica um usuário e retorna um token de acesso.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response (200):**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "expires_in": 3600
}
```

#### POST /api/v1/auth/register
Registra um novo usuário.

**Request Body:**
```json
{
  "username": "string",
  "email": "user@example.com",
  "password": "string",
  "full_name": "string"
}
```

**Response (201):**
```json
{
  "id": 1,
  "username": "newuser",
  "email": "user@example.com",
  "full_name": "New User",
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### POST /api/v1/auth/refresh
Renova um token de acesso usando o refresh token.

**Request Body:**
```json
{
  "refresh_token": "string"
}
```

#### GET /api/v1/auth/me
Retorna informações do usuário autenticado.

**Headers:** `Authorization: Bearer <token>`

## Projetos

### GET /api/v1/projects/
Lista todos os projetos do usuário.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `status` (optional): Filtrar por status (active, completed, paused)
- `priority` (optional): Filtrar por prioridade (low, medium, high)
- `page` (optional): Número da página (default: 1)
- `limit` (optional): Itens por página (default: 20)

**Response (200):**
```json
{
  "items": [
    {
      "id": 1,
      "name": "Automação de Processos",
      "description": "Automação de processos financeiros",
      "status": "active",
      "priority": "high",
      "deadline": "2024-12-31",
      "team_size": 5,
      "budget": 50000.0,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20,
  "pages": 1
}
```

### POST /api/v1/projects/
Cria um novo projeto.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "status": "active",
  "priority": "high",
  "deadline": "2024-12-31",
  "team_size": 5,
  "budget": 50000.0
}
```

### GET /api/v1/projects/{project_id}
Retorna detalhes de um projeto específico.

**Headers:** `Authorization: Bearer <token>`

### PUT /api/v1/projects/{project_id}
Atualiza um projeto.

**Headers:** `Authorization: Bearer <token>`

### DELETE /api/v1/projects/{project_id}
Remove um projeto.

**Headers:** `Authorization: Bearer <token>`

### GET /api/v1/projects/search
Busca projetos por termo.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `q` (required): Termo de busca

## Conversas

### GET /api/v1/conversations/
Lista conversas do usuário.

**Headers:** `Authorization: Bearer <token>`

### POST /api/v1/conversations/
Cria uma nova conversa.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "string",
  "content": "string",
  "type": "general"
}
```

## Dashboards

### GET /api/v1/dashboards/
Retorna dados do dashboard.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "projects": {
    "total": 10,
    "active": 5,
    "completed": 3,
    "paused": 2
  },
  "performance": {
    "automation_success_rate": 95.5,
    "average_processing_time": 120,
    "total_automations_today": 150
  },
  "recent_activities": [
    {
      "id": 1,
      "type": "project_created",
      "description": "Novo projeto criado: Automação Financeira",
      "timestamp": "2024-01-01T10:00:00Z"
    }
  ]
}
```

## Monitoramento

### GET /health
Verifica a saúde da aplicação.

**Response (200):**
```json
{
  "status": "healthy",
  "version": "2.0.0",
  "service": "MILAPP Backend",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### GET /ready
Verifica se a aplicação está pronta para receber requisições.

**Response (200):**
```json
{
  "status": "ready",
  "database": "connected",
  "redis": "connected",
  "services": "operational"
}
```

### GET /metrics
Retorna métricas Prometheus para monitoramento.

## Códigos de Status HTTP

- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Requisição inválida
- `401` - Não autorizado
- `403` - Proibido
- `404` - Não encontrado
- `422` - Dados inválidos
- `429` - Rate limit excedido
- `500` - Erro interno do servidor

## Rate Limiting

A API implementa rate limiting para proteger contra abuso:

- **Limite por minuto:** 60 requisições
- **Limite por hora:** 1000 requisições

Quando o limite é excedido, a API retorna status `429` com a mensagem:
```json
{
  "detail": "Rate limit exceeded. Please try again later."
}
```

## Segurança

### Headers de Segurança

A API inclui os seguintes headers de segurança:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'`

### Validação de Entrada

Todos os dados de entrada são validados e sanitizados para prevenir:
- SQL Injection
- XSS (Cross-Site Scripting)
- CSRF (Cross-Site Request Forgery)
- Path Traversal

## Exemplos de Uso

### Python (requests)

```python
import requests

# Login
response = requests.post('http://localhost:8000/api/v1/auth/login', json={
    'username': 'user',
    'password': 'password'
})
token = response.json()['access_token']

# Criar projeto
headers = {'Authorization': f'Bearer {token}'}
project_data = {
    'name': 'Meu Projeto RPA',
    'description': 'Automação de processos',
    'status': 'active',
    'priority': 'high'
}
response = requests.post('http://localhost:8000/api/v1/projects/', 
                        json=project_data, headers=headers)
```

### JavaScript (fetch)

```javascript
// Login
const loginResponse = await fetch('http://localhost:8000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        username: 'user',
        password: 'password'
    })
});
const { access_token } = await loginResponse.json();

// Listar projetos
const projectsResponse = await fetch('http://localhost:8000/api/v1/projects/', {
    headers: { 'Authorization': `Bearer ${access_token}` }
});
const projects = await projectsResponse.json();
```

### cURL

```bash
# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "user", "password": "password"}'

# Criar projeto
curl -X POST http://localhost:8000/api/v1/projects/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Projeto RPA", "description": "Automação"}'
```

## Erros Comuns

### 401 Unauthorized
Token inválido ou expirado. Renove o token usando o endpoint `/auth/refresh`.

### 422 Validation Error
Dados de entrada inválidos. Verifique o formato dos dados enviados.

### 429 Too Many Requests
Rate limit excedido. Aguarde antes de fazer novas requisições.

### 500 Internal Server Error
Erro interno do servidor. Verifique os logs para mais detalhes.

## Suporte

Para suporte técnico ou dúvidas sobre a API:

- **Documentação:** `/docs`
- **Issues:** GitHub Issues
- **Email:** suporte@milapp.com

## Changelog

### v2.0.0 (2024-01-01)
- Implementação completa da API REST
- Autenticação JWT
- Rate limiting
- Monitoramento com Prometheus
- Testes automatizados
- Documentação completa