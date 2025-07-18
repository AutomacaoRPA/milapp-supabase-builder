#!/bin/bash

# Script de Backup Automático do MILAPP
# Backup do banco de dados PostgreSQL com rotação e compressão

set -euo pipefail

# Configurações
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${PROJECT_ROOT}/backups"
LOG_DIR="${PROJECT_ROOT}/logs"
CONFIG_FILE="${PROJECT_ROOT}/.env"

# Configurações de backup
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-milapp}"
DB_USER="${DB_USER:-postgres}"
RETENTION_DAYS=30
COMPRESS=true
NOTIFY_ON_ERROR=true
SLACK_WEBHOOK="${SLACK_WEBHOOK:-}"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função de logging
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case "$level" in
        "INFO")
            echo -e "${GREEN}[INFO]${NC} $timestamp: $message"
            ;;
        "WARN")
            echo -e "${YELLOW}[WARN]${NC} $timestamp: $message"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} $timestamp: $message"
            ;;
        "DEBUG")
            echo -e "${BLUE}[DEBUG]${NC} $timestamp: $message"
            ;;
    esac
    
    # Salvar no arquivo de log
    echo "[$level] $timestamp: $message" >> "${LOG_DIR}/backup.log"
}

# Função para notificar erro
notify_error() {
    local error_message="$1"
    
    if [[ "$NOTIFY_ON_ERROR" == "true" && -n "$SLACK_WEBHOOK" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚨 Backup MILAPP falhou: $error_message\"}" \
            "$SLACK_WEBHOOK" || true
    fi
    
    log "ERROR" "Backup falhou: $error_message"
}

# Função para verificar dependências
check_dependencies() {
    log "INFO" "Verificando dependências..."
    
    if ! command -v pg_dump &> /dev/null; then
        log "ERROR" "pg_dump não encontrado. Instale o PostgreSQL client."
        exit 1
    fi
    
    if ! command -v gzip &> /dev/null; then
        log "WARN" "gzip não encontrado. Backup não será comprimido."
        COMPRESS=false
    fi
    
    log "INFO" "Dependências verificadas com sucesso"
}

# Função para carregar configurações do .env
load_config() {
    log "INFO" "Carregando configurações..."
    
    if [[ -f "$CONFIG_FILE" ]]; then
        log "DEBUG" "Carregando configurações do arquivo .env"
        export $(grep -v '^#' "$CONFIG_FILE" | xargs)
    else
        log "WARN" "Arquivo .env não encontrado, usando variáveis de ambiente"
    fi
    
    # Validar configurações obrigatórias
    if [[ -z "$DB_NAME" ]]; then
        log "ERROR" "DB_NAME não configurado"
        exit 1
    fi
    
    log "INFO" "Configurações carregadas: DB=$DB_NAME, HOST=$DB_HOST, PORT=$DB_PORT"
}

# Função para criar diretórios necessários
create_directories() {
    log "INFO" "Criando diretórios necessários..."
    
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$LOG_DIR"
    
    log "INFO" "Diretórios criados: $BACKUP_DIR, $LOG_DIR"
}

# Função para verificar conectividade com o banco
check_database_connection() {
    log "INFO" "Verificando conectividade com o banco de dados..."
    
    if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1; then
        log "ERROR" "Não foi possível conectar ao banco de dados"
        notify_error "Falha na conectividade com o banco"
        exit 1
    fi
    
    log "INFO" "Conexão com banco de dados estabelecida"
}

# Função para gerar nome do arquivo de backup
generate_backup_filename() {
    local timestamp=$(date '+%Y%m%d_%H%M%S')
    local filename="milapp_backup_${timestamp}.sql"
    
    if [[ "$COMPRESS" == "true" ]]; then
        filename="${filename}.gz"
    fi
    
    echo "$filename"
}

# Função para executar backup
perform_backup() {
    local backup_file="$1"
    local start_time=$(date +%s)
    
    log "INFO" "Iniciando backup do banco de dados..."
    log "INFO" "Arquivo de destino: $backup_file"
    
    # Comando de backup base
    local backup_cmd="pg_dump -h '$DB_HOST' -p '$DB_PORT' -U '$DB_USER' -d '$DB_NAME'"
    
    # Adicionar opções de backup
    backup_cmd="$backup_cmd --verbose --no-password --clean --if-exists"
    backup_cmd="$backup_cmd --no-owner --no-privileges"
    
    # Adicionar compressão se habilitada
    if [[ "$COMPRESS" == "true" ]]; then
        backup_cmd="$backup_cmd | gzip > '$backup_file'"
    else
        backup_cmd="$backup_cmd > '$backup_file'"
    fi
    
    # Executar backup
    if eval "$backup_cmd"; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        local file_size=$(du -h "$backup_file" | cut -f1)
        
        log "INFO" "Backup concluído com sucesso"
        log "INFO" "Duração: ${duration}s, Tamanho: $file_size"
        
        # Verificar integridade do backup
        verify_backup "$backup_file"
        
    else
        log "ERROR" "Falha durante o backup"
        notify_error "Erro durante execução do backup"
        exit 1
    fi
}

# Função para verificar integridade do backup
verify_backup() {
    local backup_file="$1"
    
    log "INFO" "Verificando integridade do backup..."
    
    if [[ "$COMPRESS" == "true" ]]; then
        if ! gzip -t "$backup_file" 2>/dev/null; then
            log "ERROR" "Arquivo de backup corrompido"
            rm -f "$backup_file"
            notify_error "Backup corrompido detectado"
            exit 1
        fi
    else
        if ! head -n 1 "$backup_file" | grep -q "PostgreSQL database dump"; then
            log "ERROR" "Arquivo de backup inválido"
            rm -f "$backup_file"
            notify_error "Backup inválido detectado"
            exit 1
        fi
    fi
    
    log "INFO" "Integridade do backup verificada"
}

# Função para limpar backups antigos
cleanup_old_backups() {
    log "INFO" "Limpando backups antigos (mais de $RETENTION_DAYS dias)..."
    
    local deleted_count=0
    local current_time=$(date +%s)
    local retention_seconds=$((RETENTION_DAYS * 24 * 60 * 60))
    
    while IFS= read -r -d '' file; do
        local file_time=$(stat -c %Y "$file")
        local age=$((current_time - file_time))
        
        if [[ $age -gt $retention_seconds ]]; then
            rm -f "$file"
            deleted_count=$((deleted_count + 1))
            log "DEBUG" "Backup antigo removido: $(basename "$file")"
        fi
    done < <(find "$BACKUP_DIR" -name "milapp_backup_*.sql*" -type f -print0)
    
    log "INFO" "Limpeza concluída: $deleted_count arquivos removidos"
}

# Função para gerar relatório
generate_report() {
    local backup_file="$1"
    local report_file="${LOG_DIR}/backup_report_$(date '+%Y%m%d').txt"
    
    log "INFO" "Gerando relatório de backup..."
    
    {
        echo "=== RELATÓRIO DE BACKUP MILAPP ==="
        echo "Data: $(date)"
        echo "Arquivo: $(basename "$backup_file")"
        echo "Tamanho: $(du -h "$backup_file" | cut -f1)"
        echo "Banco: $DB_NAME"
        echo "Host: $DB_HOST:$DB_PORT"
        echo "Usuário: $DB_USER"
        echo "Compressão: $COMPRESS"
        echo "Retenção: $RETENTION_DAYS dias"
        echo ""
        echo "=== ESTATÍSTICAS ==="
        echo "Total de backups: $(find "$BACKUP_DIR" -name "milapp_backup_*.sql*" | wc -l)"
        echo "Espaço total: $(du -sh "$BACKUP_DIR" | cut -f1)"
        echo "Últimos 5 backups:"
        find "$BACKUP_DIR" -name "milapp_backup_*.sql*" -type f -printf "%T@ %p\n" | \
            sort -nr | head -5 | while read timestamp file; do
            date_str=$(date -d "@${timestamp%.*}" '+%Y-%m-%d %H:%M:%S')
            size=$(du -h "$file" | cut -f1)
            echo "  $date_str - $(basename "$file") ($size)"
        done
    } > "$report_file"
    
    log "INFO" "Relatório gerado: $report_file"
}

# Função principal
main() {
    log "INFO" "=== INICIANDO BACKUP AUTOMÁTICO MILAPP ==="
    
    # Verificar se está rodando como root
    if [[ $EUID -eq 0 ]]; then
        log "WARN" "Script executado como root - não recomendado"
    fi
    
    # Executar etapas do backup
    check_dependencies
    load_config
    create_directories
    check_database_connection
    
    # Gerar nome do arquivo de backup
    local backup_filename=$(generate_backup_filename)
    local backup_path="$BACKUP_DIR/$backup_filename"
    
    # Executar backup
    perform_backup "$backup_path"
    
    # Limpar backups antigos
    cleanup_old_backups
    
    # Gerar relatório
    generate_report "$backup_path"
    
    log "INFO" "=== BACKUP CONCLUÍDO COM SUCESSO ==="
    
    # Notificar sucesso se configurado
    if [[ -n "$SLACK_WEBHOOK" ]]; then
        local file_size=$(du -h "$backup_path" | cut -f1)
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"✅ Backup MILAPP concluído: $(basename "$backup_filename") ($file_size)\"}" \
            "$SLACK_WEBHOOK" || true
    fi
}

# Tratamento de erros
trap 'log "ERROR" "Script interrompido inesperadamente"; notify_error "Script interrompido"' INT TERM

# Executar função principal
main "$@" 