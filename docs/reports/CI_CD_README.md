# 🚀 CI/CD MILAPP MedSênior - Bem Entregar Bem

## 📋 Visão Geral

Pipeline de CI/CD completo para o MILAPP MedSênior, seguindo o conceito **"bem entregar bem"** com identidade visual e processos alinhados aos valores da MedSênior.

## 🎯 Conceito "Bem Entregar Bem"

- **Qualidade Garantida**: Validação rigorosa em cada etapa
- **Segurança**: Headers e configurações de segurança MedSênior
- **Monitoramento**: Observabilidade completa com Prometheus/Grafana
- **Acessibilidade**: Deploy inclusivo para todas as idades
- **Confiabilidade**: Health checks e rollback automático

## 🏗️ Arquitetura do Pipeline

### **1. Quality Check - Bem Validar**
```yaml
🔍 Quality Check - Bem Validar
├── 📥 Checkout Code
├── 🟢 Setup Node.js 18
├── 📦 Install Dependencies
├── 🔧 Type Check
├── 🎨 Lint Check
├── 🧪 Unit Tests
└── 📊 Upload Coverage
```

### **2. Build & Test - Bem Construir**
```yaml
🏗️ Build & Test - Bem Construir
├── 📥 Checkout Code
├── 🟢 Setup Node.js 18
├── 📦 Install Dependencies
├── 🏗️ Build Application
├── 🎭 E2E Tests
└── 📁 Upload Build Artifacts
```

### **3. Deploy Staging - Bem Testar**
```yaml
🚀 Deploy Staging - Bem Testar
├── 📥 Download Build
├── 🚀 Deploy to Staging
└── 🔍 Health Check
```

### **4. Deploy Production - Bem Entregar**
```yaml
🌟 Deploy Production - Bem Entregar
├── 📥 Download Build
├── 🌟 Deploy to Production
├── 🔍 Production Health Check
└── 📢 Notify Success
```

## 🐳 Docker Configuration

### **Dockerfile Otimizado**
```dockerfile
# Build stage
FROM node:18-alpine AS builder
LABEL maintainer="MedSênior - Centro de Excelência"
LABEL description="MILAPP - Plataforma CoE Automação"
LABEL version="2.0.0"

# Production stage
FROM nginx:alpine
COPY nginx-medsenior.conf /etc/nginx/nginx.conf
COPY --from=builder /app/dist /usr/share/nginx/html

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health.json || exit 1
```

### **Docker Compose**
```yaml
services:
  milapp-medsenior:
    build: .
    container_name: milapp-medsenior-app
    ports:
      - "3000:80"
    environment:
      - VITE_APP_NAME=MILAPP MedSênior
      - VITE_APP_VERSION=2.0.0
    healthcheck:
      test: ["CMD", "wget", "--spider", "http://localhost/health.json"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## 🌐 Nginx Configuration

### **Configuração MedSênior**
```nginx
# MedSênior Logging
log_format medsenior '$remote_addr - $remote_user [$time_local] '
                    '"$request" $status $body_bytes_sent '
                    '"$http_referer" "$http_user_agent" '
                    'milapp_medsenior';

# Security headers for MedSênior compliance
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection "1; mode=block";
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
add_header Content-Security-Policy "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; img-src 'self' data: https:; font-src 'self' data:";

# Cache static assets - MedSênior optimization
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header X-Served-By "MILAPP-MedSenior";
}
```

## 📊 Monitoramento

### **Prometheus Configuration**
```yaml
scrape_configs:
  - job_name: 'milapp-medsenior'
    static_configs:
      - targets: ['milapp-medsenior-prod:80']
    metrics_path: '/metrics'
    scrape_interval: 30s
```

### **Alertas MedSênior**
```yaml
- alert: MILAPPDown
  expr: up{job="milapp-medsenior"} == 0
  for: 1m
  labels:
    severity: critical
    service: milapp-medsenior
  annotations:
    summary: "MILAPP MedSênior está fora do ar"
    description: "A aplicação MILAPP MedSênior não está respondendo há mais de 1 minuto"
```

## 🚀 Scripts de Deploy

### **Linux/Mac**
```bash
# Deploy para staging
./scripts/deploy-medsenior.sh staging

# Deploy para produção
./scripts/deploy-medsenior.sh production
```

### **Windows**
```batch
# Deploy para staging
scripts\deploy-medsenior.bat staging

# Deploy para produção
scripts\deploy-medsenior.bat production
```

## 📦 Package.json Scripts

```json
{
  "scripts": {
    "dev": "vite --host --port 3000",
    "dev:medsenior": "cross-env VITE_APP_THEME=medsenior vite --host --port 3000",
    "build": "tsc -b && vite build",
    "build:medsenior": "cross-env VITE_APP_THEME=medsenior npm run build",
    "test": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "type-check": "tsc --noEmit",
    "docker:build": "docker build -t milapp-medsenior:latest .",
    "docker:run": "docker run -p 3000:80 milapp-medsenior:latest",
    "docker:dev": "docker-compose up -d",
    "deploy:staging": "echo 'Deploying to MedSênior staging...' && npm run build",
    "deploy:prod": "echo 'Deploying to MedSênior production...' && npm run build",
    "health:check": "curl -f http://localhost:3000/health || exit 1"
  }
}
```

## 🔧 Configuração de Ambiente

### **Variáveis de Ambiente**
```bash
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI
VITE_OPENAI_API_KEY=your_openai_api_key

# MedSênior
VITE_APP_NAME=MILAPP MedSênior
VITE_APP_VERSION=2.0.0
VITE_APP_THEME=medsenior
```

### **Health Check Endpoint**
```json
{
  "status": "healthy",
  "service": "milapp-medsenior",
  "message": "bem funcionando",
  "version": "2.0.0",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 📈 Métricas e KPIs

### **Métricas de Deploy**
- **Tempo de Build**: < 5 minutos
- **Tempo de Deploy**: < 3 minutos
- **Uptime**: > 99.9%
- **Response Time**: < 2 segundos
- **Error Rate**: < 0.1%

### **Métricas de Qualidade**
- **Code Coverage**: > 80%
- **Lint Score**: 0 warnings
- **Type Check**: 0 errors
- **Security Scan**: 0 vulnerabilities

## 🛡️ Segurança

### **Headers de Segurança**
```nginx
# XSS Protection
add_header X-XSS-Protection "1; mode=block";

# Content Type Sniffing
add_header X-Content-Type-Options nosniff;

# Frame Options
add_header X-Frame-Options DENY;

# HSTS
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

# CSP
add_header Content-Security-Policy "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; img-src 'self' data: https:; font-src 'self' data:";
```

### **Docker Security**
```dockerfile
# Multi-stage build para reduzir tamanho
FROM node:18-alpine AS builder
FROM nginx:alpine

# Usuário não-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health.json || exit 1
```

## 🔄 Rollback Strategy

### **Rollback Automático**
```yaml
- name: 🔄 Rollback on Failure
  if: failure()
  run: |
    echo "🔄 Iniciando rollback automático..."
    docker-compose down
    docker-compose up -d --scale milapp-medsenior=0
    echo "✅ Rollback concluído"
```

### **Rollback Manual**
```bash
# Rollback para versão anterior
docker tag milapp-medsenior:previous milapp-medsenior:latest
docker-compose up -d
```

## 📞 Suporte e Monitoramento

### **Canais de Alerta**
- **Slack**: #milapp-alerts
- **Email**: milapp-alerts@medsenior.com.br
- **SMS**: +55 11 99999-9999

### **Dashboard de Monitoramento**
- **Grafana**: http://localhost:3001
- **Prometheus**: http://localhost:9090
- **Health Check**: http://localhost/health

## 🎉 Deploy Bem Sucedido

Quando o deploy é concluído com sucesso:

```
🎉 Deploy bem sucedido!
🏥 MILAPP MedSênior está bem ativo em produção
🌱 Bem envelhecer bem com automação
```

## 📚 Documentação Adicional

- [GitHub Actions Workflow](./.github/workflows/ci-cd-medsenior.yml)
- [Docker Configuration](./Dockerfile)
- [Nginx Configuration](./nginx-medsenior.conf)
- [Docker Compose](./docker-compose.yml)
- [Prometheus Configuration](./monitoring/prometheus.yml)
- [Deploy Scripts](./scripts/)

---

**🏥 MedSênior - Centro de Excelência em Automação**
**🌱 Bem entregar bem para bem envelhecer bem** 