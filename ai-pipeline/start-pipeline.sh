#!/bin/bash

# MILAPP - Script de Inicialização do Pipeline IA-IA
# Integração automática entre Lovable IA e Cursor IA

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log
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

# Banner
echo -e "${BLUE}"
cat << "EOF"
███╗   ███╗██╗██╗      █████╗ ██████╗ ██████╗ 
████╗ ████║██║██║     ██╔══██╗██╔══██╗██╔══██╗
██╔████╔██║██║██║     ███████║██████╔╝██████╔╝
██║╚██╔╝██║██║██║     ██╔══██║██╔═══╝ ██╔═══╝ 
██║ ╚═╝ ██║██║███████╗██║  ██║██║     ██║     
╚═╝     ╚═╝╚═╝╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝     
                                                 
🤖 Pipeline IA-IA - Lovable + Cursor Integration
EOF
echo -e "${NC}"

# Verificar se estamos no diretório correto
if [ ! -f "ai-pipeline/config.yaml" ]; then
    error "Execute este script do diretório raiz do projeto MILAPP"
    exit 1
fi

# Verificar dependências
log "Verificando dependências..."

# Python
if ! command -v python3 &> /dev/null; then
    error "Python 3 não encontrado. Instale Python 3.8+"
    exit 1
fi

# Docker
if ! command -v docker &> /dev/null; then
    warn "Docker não encontrado. Algumas funcionalidades podem não funcionar"
fi

# Git
if ! command -v git &> /dev/null; then
    error "Git não encontrado. Instale Git"
    exit 1
fi

log "Dependências verificadas ✓"

# Verificar variáveis de ambiente
log "Verificando configurações..."

# Criar arquivo .env se não existir
if [ ! -f ".env" ]; then
    warn "Arquivo .env não encontrado. Criando template..."
    cp env.example .env
    echo -e "${YELLOW}⚠️  Configure as variáveis no arquivo .env antes de continuar${NC}"
    echo -e "${YELLOW}   Variáveis necessárias:${NC}"
    echo -e "${YELLOW}   - LOVABLE_API_KEY${NC}"
    echo -e "${YELLOW}   - CURSOR_API_KEY${NC}"
    echo -e "${YELLOW}   - DEPLOY_API_KEY${NC}"
    echo -e "${YELLOW}   - REDIS_URL${NC}"
    echo -e "${YELLOW}   - ENCRYPTION_KEY${NC}"
    echo ""
    read -p "Pressione Enter após configurar o .env..."
fi

# Carregar variáveis de ambiente
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Verificar variáveis críticas
if [ -z "$LOVABLE_API_KEY" ]; then
    error "LOVABLE_API_KEY não configurada"
    exit 1
fi

if [ -z "$CURSOR_API_KEY" ]; then
    error "CURSOR_API_KEY não configurada"
    exit 1
fi

log "Configurações verificadas ✓"

# Instalar dependências Python
log "Instalando dependências Python..."

# Criar virtual environment se não existir
if [ ! -d "venv" ]; then
    log "Criando virtual environment..."
    python3 -m venv venv
fi

# Ativar virtual environment
source venv/bin/activate

# Instalar dependências
pip install -r ai-pipeline/requirements.txt

log "Dependências Python instaladas ✓"

# Criar diretórios necessários
log "Criando estrutura de diretórios..."

mkdir -p logs
mkdir -p backups
mkdir -p ai-pipeline/cache

log "Estrutura criada ✓"

# Verificar conectividade
log "Testando conectividade..."

# Testar APIs
if curl -s --connect-timeout 5 "https://api.lovable.com/health" > /dev/null; then
    log "Lovable IA: Conectado ✓"
else
    warn "Lovable IA: Não foi possível conectar"
fi

if curl -s --connect-timeout 5 "https://api.cursor.com/health" > /dev/null; then
    log "Cursor IA: Conectado ✓"
else
    warn "Cursor IA: Não foi possível conectar"
fi

# Iniciar serviços
log "Iniciando serviços..."

# Iniciar Redis se não estiver rodando
if ! docker ps | grep -q redis; then
    log "Iniciando Redis..."
    docker run -d --name milapp-redis -p 6379:6379 redis:7-alpine
fi

# Iniciar dashboard de aprovação
log "Iniciando dashboard de aprovação..."
cd ai-pipeline
streamlit run approval-dashboard.py --server.port 8501 --server.address 0.0.0.0 &
DASHBOARD_PID=$!

# Iniciar orquestrador
log "Iniciando orquestrador IA-IA..."
python automation-orchestrator.py &
ORCHESTRATOR_PID=$!

# Salvar PIDs para cleanup
echo $DASHBOARD_PID > .dashboard.pid
echo $ORCHESTRATOR_PID > .orchestrator.pid

# Aguardar inicialização
sleep 3

# Verificar se os serviços estão rodando
if kill -0 $DASHBOARD_PID 2>/dev/null; then
    log "Dashboard: Rodando ✓"
else
    error "Dashboard: Falha ao iniciar"
    exit 1
fi

if kill -0 $ORCHESTRATOR_PID 2>/dev/null; then
    log "Orquestrador: Rodando ✓"
else
    error "Orquestrador: Falha ao iniciar"
    exit 1
fi

# Mostrar informações de acesso
echo ""
echo -e "${GREEN}🎉 Pipeline IA-IA iniciado com sucesso!${NC}"
echo ""
echo -e "${BLUE}📊 Dashboard de Aprovação:${NC}"
echo -e "   URL: http://localhost:8501"
echo -e "   PID: $DASHBOARD_PID"
echo ""
echo -e "${BLUE}🤖 Orquestrador IA-IA:${NC}"
echo -e "   PID: $ORCHESTRATOR_PID"
echo ""
echo -e "${BLUE}📝 Logs:${NC}"
echo -e "   Dashboard: tail -f logs/dashboard.log"
echo -e "   Orquestrador: tail -f logs/orchestrator.log"
echo -e "   Pipeline: tail -f logs/ai-pipeline.log"
echo ""
echo -e "${YELLOW}💡 Como usar:${NC}"
echo -e "   1. Acesse http://localhost:8501"
echo -e "   2. Configure suas APIs no dashboard"
echo -e "   3. Crie uma nova task"
echo -e "   4. Aprove as mudanças geradas"
echo ""
echo -e "${YELLOW}🛑 Para parar:${NC}"
echo -e "   ./stop-pipeline.sh"
echo ""

# Função de cleanup
cleanup() {
    log "Parando serviços..."
    
    if [ -f ".dashboard.pid" ]; then
        kill $(cat .dashboard.pid) 2>/dev/null || true
        rm .dashboard.pid
    fi
    
    if [ -f ".orchestrator.pid" ]; then
        kill $(cat .orchestrator.pid) 2>/dev/null || true
        rm .orchestrator.pid
    fi
    
    log "Serviços parados ✓"
    exit 0
}

# Capturar sinais para cleanup
trap cleanup SIGINT SIGTERM

# Manter script rodando
log "Pipeline ativo. Pressione Ctrl+C para parar."
while true; do
    sleep 10
    
    # Verificar se os processos ainda estão rodando
    if [ -f ".dashboard.pid" ] && ! kill -0 $(cat .dashboard.pid) 2>/dev/null; then
        error "Dashboard parou inesperadamente"
        cleanup
    fi
    
    if [ -f ".orchestrator.pid" ] && ! kill -0 $(cat .orchestrator.pid) 2>/dev/null; then
        error "Orquestrador parou inesperadamente"
        cleanup
    fi
done 