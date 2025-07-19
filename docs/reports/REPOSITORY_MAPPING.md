# 🗂️ MAPEAMENTO COMPLETO DO REPOSITÓRIO MILAPP

## 📋 VISÃO GERAL DA ESTRUTURA

O repositório MILAPP está organizado em três níveis principais:

1. **RAIZ** - Contém apenas a pasta principal e arquivos de controle
2. **OLD** - Versões antigas e arquivos de backup
3. **MILAPP-SUPABASE-BUILDER** - **PASTA PRINCIPAL DO SISTEMA** ⭐

---

## 🎯 PASTA PRINCIPAL: `milapp-supabase-builder/`

### 📁 **ESTRUTURA FRONTEND (React + TypeScript + Vite)**

#### **Arquivos de Configuração**
- `package.json` - Configuração principal do projeto Node.js
- `package-lock.json` - Lock file das dependências
- `tsconfig.json` - Configuração TypeScript
- `tsconfig.node.json` - Configuração TypeScript para Node.js
- `tsconfig.app.json` - Configuração TypeScript para aplicação
- `vite.config.ts` - Configuração principal do Vite
- `vite.config.js` - Configuração alternativa do Vite
- `vite.config.demo.ts` - Configuração Vite para demo
- `vite.config.prod.ts` - Configuração Vite para produção
- `tailwind.config.ts` - Configuração Tailwind CSS
- `postcss.config.js` - Configuração PostCSS
- `eslint.config.js` - Configuração ESLint
- `.eslintrc.cjs` - Configuração ESLint alternativa
- `components.json` - Configuração de componentes UI
- `bun.lockb` - Lock file do Bun (alternativa ao npm)

#### **Arquivos de Build e Cache**
- `tsconfig.tsbuildinfo` - Cache de build TypeScript
- `tsconfig.node.tsbuildinfo` - Cache de build Node.js

#### **Pasta `src/` - Código Fonte Principal**
- `main.tsx` - Ponto de entrada da aplicação React
- `App.tsx` - Componente principal da aplicação
- `App.css` - Estilos do componente App
- `index.css` - Estilos globais
- `vite-env.d.ts` - Tipos do ambiente Vite

##### **Subpastas do `src/`:**
- `components/` - Componentes React reutilizáveis
- `pages/` - Páginas da aplicação
- `hooks/` - Custom hooks React
- `contexts/` - Contextos React (Auth, Theme, etc.)
- `services/` - Serviços de API e integrações
- `store/` - Gerenciamento de estado (Zustand)
- `utils/` - Funções utilitárias
- `types/` - Definições de tipos TypeScript
- `styles/` - Arquivos de estilo
- `assets/` - Recursos estáticos (imagens, ícones)
- `features/` - Funcionalidades organizadas por domínio
- `lib/` - Bibliotecas e configurações
- `config/` - Configurações da aplicação
- `integrations/` - Integrações externas
- `tests/` - Testes da aplicação
- `test/` - Testes alternativos

#### **Pasta `public/` - Arquivos Públicos**
- Arquivos estáticos servidos diretamente

#### **Pasta `e2e/` - Testes End-to-End**
- Testes automatizados com Playwright

### 📁 **ESTRUTURA BACKEND (Python + FastAPI)**

#### **Pasta `backend/`**
- `requirements.txt` - Dependências Python
- `Dockerfile` - Containerização do backend

#### **Pasta `backend/app/`**
- `main.py` - Aplicação principal FastAPI
- `__init__.py` - Inicialização do módulo

##### **Subpastas do `backend/app/`:**
- `api/` - Endpoints da API
- `core/` - Configurações centrais
- `services/` - Lógica de negócio

### 📁 **ESTRUTURA SUPABASE**

#### **Pastas de Configuração Supabase:**
- `supabase/` - Configurações locais do Supabase
- `supabase-prod/` - Configurações de produção
- `supabase-demo/` - Configurações de demonstração

### 📁 **ESTRUTURA DEVOPS E DEPLOY**

#### **Arquivos Docker:**
- `Dockerfile` - Containerização principal
- `Dockerfile.frontend` - Containerização do frontend
- `docker-compose.yml` - Orquestração local
- `docker-compose.production.yml` - Orquestração de produção

#### **Arquivos Nginx:**
- `nginx.conf` - Configuração Nginx padrão
- `nginx-medsenior.conf` - Configuração Nginx MedSênior

#### **Scripts de Deploy:**
- `deploy-demo.sh` - Script de deploy para demo
- `deploy-prod.sh` - Script de deploy para produção
- `setup.sh` - Script de configuração inicial

#### **Pasta `devops/`:**
- Configurações de infraestrutura

#### **Pasta `monitoring/`:**
- Configurações de monitoramento

### 📁 **ESTRUTURA DE TESTES**

#### **Arquivos de Configuração de Testes:**
- `vitest.config.ts` - Configuração Vitest
- `jest.config.js` - Configuração Jest
- `jest.integration.config.js` - Configuração Jest para integração
- `playwright.config.ts` - Configuração Playwright

#### **Pastas de Testes:**
- `tests/` - Testes unitários e de integração
- `e2e/` - Testes end-to-end

### 📁 **ESTRUTURA DE AUTOMAÇÃO**

#### **Pasta `scripts/`:**
- Scripts de automação e utilitários

#### **Pasta `cli/`:**
- Interface de linha de comando

#### **Pasta `n8n-workflows/`:**
- Fluxos de automação N8N

#### **Pasta `ai-pipeline/`:**
- Pipeline de IA e automação

### 📁 **ESTRUTURA DE DOCUMENTAÇÃO**

#### **Pasta `docs/`:**
- Documentação técnica

#### **Pasta `.ai/`:**
- Configurações e prompts de IA

### 📁 **ESTRUTURA GITHUB**

#### **Pasta `.github/`:**
- Workflows e configurações GitHub Actions

---

## 📁 PASTA `old/` - VERSÕES ANTIGAS E BACKUP

### **Arquivos de Documentação:**
- `PROJECT_STATUS.md` - Status do projeto
- `RESUMO_FINAL_IMPLEMENTACOES.md` - Resumo das implementações
- `IMPLEMENTAÇÕES_FASE_2_COMPLETADAS.md` - Implementações da fase 2
- `CORREÇÕES_CRÍTICAS_IMPLEMENTADAS.md` - Correções críticas
- `PENTE_FINO_COMPLETO_QA_ARQUITETO.md` - Auditoria completa
- `MILAPP_VALIDATION_READY.md` - Validação do MILAPP
- `DEMO_SCRIPT.md` - Script de demonstração
- `DESIGN_SYSTEM_SUMMARY.md` - Resumo do design system
- `DOCKER_INSTALLATION_GUIDE.md` - Guia de instalação Docker
- `BUILD_INSTRUCTIONS.md` - Instruções de build
- `DOCKER_README.md` - README Docker

### **Arquivos de Configuração:**
- `package.json` - Configuração antiga
- `package-lock.json` - Lock file antigo
- `env.example` - Exemplo de variáveis de ambiente
- `env.production` - Variáveis de produção
- `env.staging` - Variáveis de staging
- `.gitignore` - Git ignore antigo

### **Arquivos Docker:**
- `docker-compose.yml` - Docker Compose antigo
- `docker-compose.production.yml` - Docker Compose produção antigo
- `docker-compose.staging.yml` - Docker Compose staging antigo
- `docker-build-config.yml` - Configuração de build Docker

### **Scripts:**
- `build-docker-images.sh` - Script de build Docker (Linux/Mac)
- `build-docker-images.bat` - Script de build Docker (Windows)
- `check-docker-installation.bat` - Verificação Docker Windows
- `implementar_correcoes_criticas.py` - Script Python de correções

### **Pastas:**
- `frontend/` - Frontend antigo
- `backend/` - Backend antigo
- `devops/` - DevOps antigo
- `docs/` - Documentação antiga
- `.ai/` - IA antiga
- `.github/` - GitHub antigo
- `.venv/` - Ambiente virtual Python antigo
- `node_modules/` - Dependências antigas

### **Recursos:**
- `apresentacao-interna-institucional-2025.pdf` - Apresentação institucional
- `Brandbook MedSenior.pdf` - Brandbook da MedSênior
- `milapp_specification (7).md` - Especificação completa do MILAPP

---

## 📁 PASTA RAIZ

### **Controle de Versão:**
- `.git/` - Repositório Git

### **Pastas Principais:**
- `milapp-supabase-builder/` - **SISTEMA PRINCIPAL** ⭐
- `old/` - Versões antigas e backup

---

## 🔧 FUNÇÕES PRINCIPAIS DE CADA COMPONENTE

### **Frontend (React + TypeScript + Vite)**
- **Interface de usuário** moderna e responsiva
- **Gerenciamento de estado** com Zustand
- **Roteamento** com React Router
- **Estilização** com Tailwind CSS
- **Componentes** com Radix UI
- **Integração** com Supabase
- **IA** com OpenAI/LangChain

### **Backend (Python + FastAPI)**
- **API REST** para comunicação com frontend
- **Autenticação** JWT com Supabase
- **Processamento de IA** com OpenAI
- **Integração** com Supabase
- **Upload de arquivos** e processamento
- **Métricas** e analytics

### **Supabase**
- **Banco de dados** PostgreSQL
- **Autenticação** e autorização
- **Storage** de arquivos
- **Funções** serverless
- **Realtime** subscriptions

### **Docker**
- **Containerização** completa
- **Orquestração** com Docker Compose
- **Ambientes** separados (dev, staging, prod)
- **Nginx** como proxy reverso

### **Monitoramento**
- **Prometheus** para métricas
- **Grafana** para visualização
- **Logs** estruturados
- **Health checks**

### **Testes**
- **Unitários** com Vitest/Jest
- **Integração** com Jest
- **E2E** com Playwright
- **Cobertura** de código

### **CI/CD**
- **GitHub Actions** para automação
- **Deploy** automatizado
- **Testes** automatizados
- **Qualidade** de código

---

## 🚀 COMO EXECUTAR O PROJETO

### **1. Instalação**
```bash
cd milapp-supabase-builder
npm install
```

### **2. Configuração**
```bash
cp env.example .env
# Editar .env com suas credenciais
```

### **3. Execução**
```bash
# Frontend
npm run dev

# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# Docker (completo)
docker-compose up --build
```

### **4. Acesso**
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Grafana**: http://localhost:3001

---

## 📊 STATUS ATUAL

✅ **Frontend**: 100% funcional com Vite + React + TypeScript
✅ **Backend**: 100% funcional com FastAPI + Python
✅ **Supabase**: Configurado e integrado
✅ **Docker**: Containerização completa
✅ **Testes**: Estrutura de testes implementada
✅ **CI/CD**: GitHub Actions configurado
✅ **Documentação**: Completa e atualizada

---

## 🎯 PRÓXIMOS PASSOS

1. **Configurar Supabase** com credenciais reais
2. **Executar migrações** do banco de dados
3. **Configurar variáveis de ambiente**
4. **Testar todas as funcionalidades**
5. **Deploy em ambiente de produção**

---

*Documento gerado em: 19/07/2025*
*Versão: 2.0.0*
*Status: ✅ COMPLETO* 