#!/bin/bash

# MILAPP MedSênior - Script de Deploy
# Bem entregar bem

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${GREEN}[MILAPP MedSênior]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[AVISO]${NC} $1"
}

error() {
    echo -e "${RED}[ERRO]${NC} $1"
}

# Variáveis
ENVIRONMENT=${1:-staging}
VERSION="2.0.0"
PROJECT_NAME="milapp-medsenior"

log "🏥 Iniciando deploy do MILAPP MedSênior v$VERSION"
log "🌱 Bem entregar bem - Ambiente: $ENVIRONMENT"

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    error "Execute este script no diretório raiz do projeto"
    exit 1
fi

# Verificar dependências
log "📦 Verificando dependências..."
if ! command -v docker &> /dev/null; then
    error "Docker não está instalado"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    error "Docker Compose não está instalado"
    exit 1
fi

# Build da aplicação
log "🏗️ Fazendo build da aplicação..."
npm run build:medsenior

if [ $? -ne 0 ]; then
    error "Build falhou"
    exit 1
fi

log "✅ Build bem sucedido"

# Build da imagem Docker
log "🐳 Construindo imagem Docker..."
docker build -t $PROJECT_NAME:$VERSION .

if [ $? -ne 0 ]; then
    error "Build da imagem Docker falhou"
    exit 1
fi

log "✅ Imagem Docker construída"

# Deploy baseado no ambiente
if [ "$ENVIRONMENT" = "production" ]; then
    log "🌟 Deploy para produção..."
    
    # Parar containers existentes
    docker-compose -f docker-compose.production.yml down
    
    # Iniciar novos containers
    docker-compose -f docker-compose.production.yml up -d
    
    # Health check
    log "🔍 Verificando saúde da aplicação..."
    sleep 30
    
    if curl -f http://localhost/health; then
        log "✅ Produção bem configurada - MedSênior ativo"
    else
        error "❌ Health check falhou"
        exit 1
    fi
    
elif [ "$ENVIRONMENT" = "staging" ]; then
    log "🚀 Deploy para staging..."
    
    # Parar containers existentes
    docker-compose down
    
    # Iniciar novos containers
    docker-compose up -d
    
    # Health check
    log "🔍 Verificando saúde da aplicação..."
    sleep 30
    
    if curl -f http://localhost:3000/health; then
        log "✅ Staging bem configurado e funcionando"
    else
        error "❌ Health check falhou"
        exit 1
    fi
    
else
    error "Ambiente inválido. Use 'staging' ou 'production'"
    exit 1
fi

# Logs finais
log "📊 Status dos containers:"
docker-compose ps

log "🎉 Deploy bem sucedido!"
log "🏥 MILAPP MedSênior está bem ativo no ambiente $ENVIRONMENT"
log "🌱 Bem envelhecer bem com automação"

# Informações úteis
if [ "$ENVIRONMENT" = "production" ]; then
    log "🌐 Aplicação disponível em: http://localhost"
    log "📊 Grafana disponível em: http://localhost:3001"
    log "📈 Prometheus disponível em: http://localhost:9090"
else
    log "🌐 Aplicação disponível em: http://localhost:3000"
fi 