# MILAPP Backend

Backend robusto e escalável para o Centro de Excelência em Automação RPA, construído com FastAPI, PostgreSQL e Redis.

## 🚀 Características

- **FastAPI** - Framework moderno e rápido para APIs
- **PostgreSQL** - Banco de dados relacional robusto
- **Redis** - Cache e sessões em memória
- **JWT Authentication** - Autenticação segura
- **Rate Limiting** - Proteção contra abuso
- **Prometheus Metrics** - Monitoramento em tempo real
- **Testes Automatizados** - 90%+ cobertura de código
- **CI/CD Pipeline** - Deploy automatizado
- **Documentação Completa** - Swagger UI e ReDoc

## 📋 Pré-requisitos

- Python 3.11+
- PostgreSQL 15+
- Redis 7+
- Docker (opcional)

## 🛠️ Instalação

### 1. Clone o repositório
```bash
git clone <repository-url>
cd milapp/backend
```

### 2. Crie um ambiente virtual
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows
```

### 3. Instale as dependências
```bash
pip install -r requirements.txt
```

### 4. Configure as variáveis de ambiente
```bash
cp ../env.example .env
# Edite o arquivo .env com suas configurações
```

### 5. Configure o banco de dados
```bash
# Crie o banco PostgreSQL
createdb milapp_db

# Execute as migrações
alembic upgrade head
```

### 6. Inicie o Redis
```bash
redis-server
```

## 🏃‍♂️ Executando a Aplicação

### Desenvolvimento
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Produção
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Docker
```bash
docker build -t milapp-backend .
docker run -p 8000:8000 milapp-backend
```

## 🧪 Testes

### Executar todos os testes
```bash
python run_tests.py
```

### Executar testes específicos
```bash
# Testes unitários
pytest tests/ -v

# Testes com cobertura
pytest tests/ --cov=app --cov-report=html

# Testes de performance
locust -f tests/performance/locustfile.py

# Verificações de segurança
bandit -r app/
safety check
```

### Cobertura de Testes
```bash
pytest tests/ --cov=app --cov-report=term-missing --cov-fail-under=90
```

## 📊 Monitoramento

### Métricas Prometheus
Acesse `/metrics` para ver as métricas do Prometheus.

### Health Checks
- `/health` - Status da aplicação
- `/ready` - Prontidão para receber requisições

### Grafana Dashboard
```bash
cd ../monitoring
docker-compose up -d
```

Acesse http://localhost:3000 (admin/milapp2024)

## 🔒 Segurança

### Rate Limiting
- 60 requisições por minuto
- 1000 requisições por hora

### Headers de Segurança
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security
- Content-Security-Policy

### Validação de Entrada
Todos os dados são validados e sanitizados para prevenir:
- SQL Injection
- XSS (Cross-Site Scripting)
- CSRF (Cross-Site Request Forgery)

## 📚 Documentação

### API Documentation
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
- **Documentação Completa:** [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

### Estrutura do Projeto
```
backend/
├── app/
│   ├── api/           # Endpoints da API
│   ├── core/          # Configurações e utilitários
│   ├── models/        # Modelos de dados
│   ├── services/      # Lógica de negócio
│   └── main.py        # Aplicação principal
├── tests/             # Testes automatizados
├── monitoring/        # Configurações de monitoramento
├── requirements.txt   # Dependências Python
└── README.md         # Este arquivo
```

## 🔧 Desenvolvimento

### Estrutura de Branches
- `main` - Código de produção
- `develop` - Código de desenvolvimento
- `feature/*` - Novas funcionalidades
- `hotfix/*` - Correções urgentes

### Padrões de Código
```bash
# Formatação automática
black app/ tests/
isort app/ tests/

# Linting
flake8 app/ tests/
```

### Commit Messages
Siga o padrão Conventional Commits:
```
feat: add new authentication endpoint
fix: resolve database connection issue
docs: update API documentation
test: add unit tests for project service
```

## 🚀 Deploy

### CI/CD Pipeline
O GitHub Actions executa automaticamente:
1. Linting e formatação
2. Testes unitários
3. Verificações de segurança
4. Testes de performance
5. Deploy (se todos os testes passarem)

### Docker Compose
```bash
docker-compose up -d
```

### Kubernetes
```bash
kubectl apply -f k8s/
```

## 📈 Performance

### Métricas Alvo
- **Response Time:** < 200ms (95th percentile)
- **Throughput:** 1000+ req/s
- **Uptime:** 99.9%
- **Test Coverage:** 90%+

### Otimizações
- Cache Redis para consultas frequentes
- Connection pooling para banco de dados
- Compressão gzip
- Rate limiting inteligente

## 🐛 Troubleshooting

### Problemas Comuns

#### Erro de conexão com banco
```bash
# Verifique se o PostgreSQL está rodando
sudo systemctl status postgresql

# Verifique as credenciais no .env
DATABASE_URL=postgresql://user:password@localhost:5432/milapp_db
```

#### Erro de conexão com Redis
```bash
# Verifique se o Redis está rodando
redis-cli ping

# Verifique a URL no .env
REDIS_URL=redis://localhost:6379
```

#### Testes falhando
```bash
# Limpe o cache do pytest
pytest --cache-clear

# Verifique as variáveis de ambiente de teste
export DATABASE_URL="sqlite:///./test.db"
export REDIS_URL="redis://localhost:6379"
```

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a MIT License - veja o arquivo [LICENSE](../LICENSE) para detalhes.

## 📞 Suporte

- **Issues:** [GitHub Issues](https://github.com/milapp/issues)
- **Email:** suporte@milapp.com
- **Documentação:** [docs.milapp.com](https://docs.milapp.com)

---

**MILAPP Backend** - Construindo o futuro da automação RPA 🚀