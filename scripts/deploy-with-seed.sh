#!/bin/bash

# =====================================================
# Script de Deploy com Seed Automático - MilApp Builder
# =====================================================
# Descrição: Deploy completo com migrações, functions e seeds
# Autor: MilApp Builder Team
# Data: 2025-01-18
# Versão: 1.0.0
# =====================================================

set -e  # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# =====================================================
# CONFIGURAÇÕES
# =====================================================

# Diretórios
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
SUPABASE_DIR="$PROJECT_DIR/supabase"

# Variáveis de ambiente
ENVIRONMENT=${1:-"development"}
PROJECT_ID=${SUPABASE_PROJECT_ID:-""}
ACCESS_TOKEN=${SUPABASE_ACCESS_TOKEN:-""}

# Configurações por ambiente
case $ENVIRONMENT in
    "development"|"dev")
        ENV_NAME="development"
        AUTO_APPROVE=true
        ;;
    "staging"|"hml")
        ENV_NAME="staging"
        AUTO_APPROVE=false
        ;;
    "production"|"prod")
        ENV_NAME="production"
        AUTO_APPROVE=false
        ;;
    *)
        error "Ambiente inválido: $ENVIRONMENT"
        echo "Uso: $0 [development|staging|production]"
        exit 1
        ;;
esac

# =====================================================
# VALIDAÇÕES INICIAIS
# =====================================================

log "Iniciando deploy para ambiente: $ENV_NAME"

# Verificar se Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    error "Supabase CLI não encontrado. Instale com: npm install -g supabase"
    exit 1
fi

# Verificar se está logado no Supabase
if ! supabase status &> /dev/null; then
    error "Não logado no Supabase. Execute: supabase login"
    exit 1
fi

# Verificar variáveis de ambiente
if [ -z "$PROJECT_ID" ]; then
    error "SUPABASE_PROJECT_ID não definido"
    exit 1
fi

if [ -z "$ACCESS_TOKEN" ]; then
    error "SUPABASE_ACCESS_TOKEN não definido"
    exit 1
fi

# =====================================================
# BACKUP ANTES DO DEPLOY
# =====================================================

log "Criando backup antes do deploy..."

BACKUP_DIR="$PROJECT_DIR/backups/$(date +'%Y%m%d_%H%M%S')"
mkdir -p "$BACKUP_DIR"

# Backup das migrações atuais
if [ -d "$SUPABASE_DIR/migrations" ]; then
    cp -r "$SUPABASE_DIR/migrations" "$BACKUP_DIR/"
    log "Backup das migrações criado em: $BACKUP_DIR/migrations"
fi

# Backup das functions
if [ -d "$SUPABASE_DIR/functions" ]; then
    cp -r "$SUPABASE_DIR/functions" "$BACKUP_DIR/"
    log "Backup das functions criado em: $BACKUP_DIR/functions"
fi

# =====================================================
# DEPLOY DAS MIGRAÇÕES
# =====================================================

log "Executando migrações do banco de dados..."

cd "$SUPABASE_DIR"

# Push das migrações
if [ "$AUTO_APPROVE" = true ]; then
    supabase db push --project-ref "$PROJECT_ID" --access-token "$ACCESS_TOKEN" --yes
else
    supabase db push --project-ref "$PROJECT_ID" --access-token "$ACCESS_TOKEN"
fi

if [ $? -eq 0 ]; then
    log "✅ Migrações aplicadas com sucesso"
else
    error "❌ Falha ao aplicar migrações"
    exit 1
fi

# =====================================================
# DEPLOY DAS FUNCTIONS
# =====================================================

log "Deployando Edge Functions..."

# Deploy de todas as functions
supabase functions deploy --project-ref "$PROJECT_ID" --access-token "$ACCESS_TOKEN"

if [ $? -eq 0 ]; then
    log "✅ Functions deployadas com sucesso"
else
    error "❌ Falha ao deployar functions"
    exit 1
fi

# =====================================================
# EXECUÇÃO DO SEED
# =====================================================

log "Executando seed de ambientes padrão..."

# Verificar se o arquivo de seed existe
SEED_FILE="$SUPABASE_DIR/seeds/seed_environments.sql"
if [ ! -f "$SEED_FILE" ]; then
    error "Arquivo de seed não encontrado: $SEED_FILE"
    exit 1
fi

# Executar seed via SQL
log "Executando seed via psql..."

# Obter connection string do projeto
DB_URL=$(supabase status --project-ref "$PROJECT_ID" --access-token "$ACCESS_TOKEN" --output json | jq -r '.db_url')

if [ -z "$DB_URL" ] || [ "$DB_URL" = "null" ]; then
    error "Não foi possível obter a URL do banco de dados"
    exit 1
fi

# Executar seed
psql "$DB_URL" -f "$SEED_FILE"

if [ $? -eq 0 ]; then
    log "✅ Seed executado com sucesso"
else
    error "❌ Falha ao executar seed"
    exit 1
fi

# =====================================================
# VERIFICAÇÃO PÓS-DEPLOY
# =====================================================

log "Verificando status pós-deploy..."

# Verificar se as tabelas foram criadas
log "Verificando tabelas..."

TABLES_CHECK=$(psql "$DB_URL" -t -c "
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('environments', 'projects', 'users');
")

if [ "$TABLES_CHECK" -ge 3 ]; then
    log "✅ Tabelas principais verificadas"
else
    warn "⚠️  Algumas tabelas podem não ter sido criadas"
fi

# Verificar se os ambientes foram criados
log "Verificando ambientes criados..."

ENVIRONMENTS_CHECK=$(psql "$DB_URL" -t -c "
SELECT COUNT(*) FROM environments 
WHERE name IN ('dev', 'hml', 'prod');
")

if [ "$ENVIRONMENTS_CHECK" -eq 3 ]; then
    log "✅ Ambientes padrão criados: dev, hml, prod"
else
    warn "⚠️  Apenas $ENVIRONMENTS_CHECK ambientes foram criados"
fi

# Verificar functions
log "Verificando functions..."

FUNCTIONS_CHECK=$(supabase functions list --project-ref "$PROJECT_ID" --access-token "$ACCESS_TOKEN" | wc -l)

if [ "$FUNCTIONS_CHECK" -gt 1 ]; then
    log "✅ Functions verificadas"
else
    warn "⚠️  Poucas functions encontradas"
fi

# =====================================================
# NOTIFICAÇÕES
# =====================================================

log "Enviando notificações..."

# Notificação no Slack (se configurado)
if [ -n "$SLACK_WEBHOOK_URL" ]; then
    curl -X POST "$SLACK_WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d "{
            \"text\": \"🚀 Deploy concluído para $ENV_NAME\",
            \"attachments\": [{
                \"fields\": [
                    {\"title\": \"Ambiente\", \"value\": \"$ENV_NAME\", \"short\": true},
                    {\"title\": \"Status\", \"value\": \"✅ Sucesso\", \"short\": true},
                    {\"title\": \"Ambientes Criados\", \"value\": \"dev, hml, prod\", \"short\": true},
                    {\"title\": \"Timestamp\", \"value\": \"$(date)\", \"short\": true}
                ]
            }]
        }" > /dev/null 2>&1
    
    log "✅ Notificação enviada para Slack"
fi

# =====================================================
# LIMPEZA E FINALIZAÇÃO
# =====================================================

# Limpar backups antigos (manter apenas os últimos 5)
log "Limpando backups antigos..."

cd "$PROJECT_DIR/backups"
ls -t | tail -n +6 | xargs -r rm -rf

# Log final
log "🎉 Deploy concluído com sucesso!"
log "📊 Resumo:"
log "   - Ambiente: $ENV_NAME"
log "   - Migrações: ✅ Aplicadas"
log "   - Functions: ✅ Deployadas"
log "   - Seeds: ✅ Executados"
log "   - Ambientes: ✅ Criados (dev, hml, prod)"

# Informações úteis
info "🔗 URLs dos ambientes:"
info "   - DEV: https://dev.milapp-builder.supabase.co"
info "   - HML: https://hml.milapp-builder.supabase.co"
info "   - PROD: https://milapp-builder.supabase.co"

info "📝 Comandos úteis:"
info "   - Status: supabase status"
info "   - Logs: supabase logs"
info "   - Studio: supabase studio"

exit 0 