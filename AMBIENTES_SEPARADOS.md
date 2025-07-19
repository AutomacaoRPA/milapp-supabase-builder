# 🌍 AMBIENTES SEPARADOS - MILAPP

Este documento descreve como usar os ambientes separados do MILAPP: **Staging/Demo** e **Produção**.

## 📋 Visão Geral

O MILAPP agora possui dois ambientes completamente separados:

### 🧪 **Ambiente de Staging/Demo**
- **Propósito**: Testes, demonstrações e desenvolvimento
- **Portas**: 3001, 8001, 8502, 9091, 6380, 9002, 9003
- **Configuração**: `docker-compose.staging.yml`
- **Variáveis**: `env.staging`

### 🚀 **Ambiente de Produção**
- **Propósito**: Ambiente final para usuários
- **Portas**: 3000, 8000, 8501, 9090, 6379, 9000, 9001
- **Configuração**: `docker-compose.production.yml`
- **Variáveis**: `env.production`

## 🛠️ Como Usar

### Windows

#### Opção 1: Gerenciador Interativo
```bash
cd scripts
manage-environments.bat
```

#### Opção 2: Scripts Individuais
```bash
# Iniciar Staging
cd scripts
start-staging.bat

# Iniciar Produção
cd scripts
start-production.bat
```

### Linux/Mac

#### Opção 1: Gerenciador Interativo
```bash
cd scripts
chmod +x manage-environments.sh
./manage-environments.sh
```

#### Opção 2: Scripts Individuais
```bash
# Iniciar Staging
cd scripts
chmod +x start-staging.sh
./start-staging.sh

# Iniciar Produção
cd scripts
chmod +x start-production.sh
./start-production.sh
```

## 🌐 URLs dos Serviços

### Staging/Demo
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:8001
- **Dashboard**: http://localhost:8502
- **Grafana**: http://localhost:3002 (admin/admin-staging)
- **Prometheus**: http://localhost:9091
- **MinIO Console**: http://localhost:9003

### Produção
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Dashboard**: http://localhost:8501
- **Grafana**: http://localhost:3001
- **Prometheus**: http://localhost:9090
- **MinIO Console**: http://localhost:9001

## ⚙️ Configuração

### 1. Variáveis de Ambiente

#### Staging (`env.staging`)
```bash
# Copie o arquivo de exemplo
cp env.staging env.staging.local

# Edite as variáveis conforme necessário
nano env.staging.local
```

#### Produção (`env.production`)
```bash
# Copie o arquivo de exemplo
cp env.production env.production.local

# Edite as variáveis conforme necessário
nano env.production.local
```

### 2. Configurações Importantes

#### Segurança
- **Staging**: `DEBUG=true`, senhas simples
- **Produção**: `DEBUG=false`, senhas seguras

#### Recursos
- **Staging**: Recursos limitados para desenvolvimento
- **Produção**: Múltiplas réplicas, recursos otimizados

#### Monitoramento
- **Staging**: Configuração básica
- **Produção**: Monitoramento completo com alertas

## 🔧 Comandos Úteis

### Docker Compose Direto

#### Staging
```bash
# Iniciar
docker-compose -f docker-compose.staging.yml up -d

# Parar
docker-compose -f docker-compose.staging.yml down

# Logs
docker-compose -f docker-compose.staging.yml logs -f

# Status
docker-compose -f docker-compose.staging.yml ps
```

#### Produção
```bash
# Iniciar
docker-compose -f docker-compose.production.yml up -d

# Parar
docker-compose -f docker-compose.production.yml down

# Logs
docker-compose -f docker-compose.production.yml logs -f

# Status
docker-compose -f docker-compose.production.yml ps
```

### Backup e Restore

#### Backup
```bash
cd scripts
./backup.sh
```

#### Restore
```bash
cd scripts
./restore.sh
```

## 🚨 Segurança

### Staging/Demo
- ✅ Ambiente isolado
- ✅ Dados de teste
- ✅ Configurações de desenvolvimento
- ⚠️ Não usar dados reais

### Produção
- ✅ Ambiente isolado
- ✅ Dados reais
- ✅ Configurações de segurança
- ✅ Monitoramento completo
- ⚠️ Sempre fazer backup antes de mudanças

## 🔍 Troubleshooting

### Problemas Comuns

#### 1. Portas em Conflito
```bash
# Verificar portas em uso
netstat -tuln | grep -E ":(3000|3001|8000|8001)"

# Parar todos os ambientes
cd scripts
./manage-environments.sh
# Opção 5: Parar todos os ambientes
```

#### 2. Volumes Corrompidos
```bash
# Limpar volumes (CUIDADO!)
cd scripts
./manage-environments.sh
# Opção 10: Limpar volumes
```

#### 3. Containers Não Iniciam
```bash
# Verificar logs
docker-compose -f docker-compose.staging.yml logs
docker-compose -f docker-compose.production.yml logs

# Verificar variáveis de ambiente
cat env.staging
cat env.production
```

#### 4. Problemas de Rede
```bash
# Verificar redes Docker
docker network ls

# Limpar redes não utilizadas
docker network prune
```

## 📊 Monitoramento

### Staging
- **Prometheus**: http://localhost:9091
- **Grafana**: http://localhost:3002
- **Métricas**: Básicas para desenvolvimento

### Produção
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001
- **Métricas**: Completas com alertas

## 🔄 CI/CD

O pipeline CI/CD está configurado para:

1. **Desenvolvimento** → Staging
2. **Staging** → Produção (após aprovação)

### Workflow
```yaml
# .github/workflows/ci-cd.yml
- Deploy para staging
- Testes de smoke
- Deploy para produção
```

## 📝 Logs

### Localização dos Logs
- **Staging**: `logs/staging/`
- **Produção**: `logs/production/`

### Comandos de Log
```bash
# Logs em tempo real
docker-compose -f docker-compose.staging.yml logs -f backend-staging
docker-compose -f docker-compose.production.yml logs -f backend-production

# Logs específicos
docker logs milapp-backend-staging
docker logs milapp-backend-production
```

## 🎯 Próximos Passos

1. **Configurar variáveis de ambiente** para seu ambiente
2. **Testar ambos os ambientes** localmente
3. **Configurar monitoramento** e alertas
4. **Implementar backup automático**
5. **Configurar CI/CD** para deploy automático

## 📞 Suporte

Para problemas ou dúvidas:
- Verificar logs dos containers
- Consultar documentação técnica
- Abrir issue no repositório

---

**⚠️ Lembre-se**: Sempre use o ambiente de Staging para testes antes de fazer mudanças em Produção! 