#!/bin/bash

# Script para gerenciar ambientes MILAPP
echo "🔧 Gerenciador de Ambientes MILAPP"
echo "=================================="

# Função para mostrar menu
show_menu() {
    echo ""
    echo "Escolha uma opção:"
    echo "1) Iniciar ambiente de Staging/Demo"
    echo "2) Iniciar ambiente de Produção"
    echo "3) Parar ambiente de Staging/Demo"
    echo "4) Parar ambiente de Produção"
    echo "5) Parar todos os ambientes"
    echo "6) Status dos ambientes"
    echo "7) Logs do ambiente de Staging"
    echo "8) Logs do ambiente de Produção"
    echo "9) Backup de dados"
    echo "10) Limpar volumes (CUIDADO!)"
    echo "0) Sair"
    echo ""
}

# Função para iniciar staging
start_staging() {
    echo "🚀 Iniciando ambiente de Staging/Demo..."
    ./start-staging.sh
}

# Função para iniciar produção
start_production() {
    echo "🚀 Iniciando ambiente de Produção..."
    ./start-production.sh
}

# Função para parar staging
stop_staging() {
    echo "🛑 Parando ambiente de Staging/Demo..."
    docker-compose -f ../docker-compose.staging.yml down
    echo "✅ Ambiente de Staging/Demo parado"
}

# Função para parar produção
stop_production() {
    echo "🛑 Parando ambiente de Produção..."
    docker-compose -f ../docker-compose.production.yml down
    echo "✅ Ambiente de Produção parado"
}

# Função para parar todos
stop_all() {
    echo "🛑 Parando todos os ambientes..."
    docker-compose -f ../docker-compose.staging.yml down
    docker-compose -f ../docker-compose.production.yml down
    echo "✅ Todos os ambientes parados"
}

# Função para mostrar status
show_status() {
    echo "📊 Status dos Ambientes"
    echo "======================"
    
    echo ""
    echo "🔍 Ambiente de Staging/Demo:"
    docker-compose -f ../docker-compose.staging.yml ps 2>/dev/null || echo "   Não está rodando"
    
    echo ""
    echo "🔍 Ambiente de Produção:"
    docker-compose -f ../docker-compose.production.yml ps 2>/dev/null || echo "   Não está rodando"
    
    echo ""
    echo "🌐 Portas em uso:"
    netstat -tuln | grep -E ":(3000|3001|8000|8001|8501|8502|9090|9091|6379|6380|9000|9001|9002|9003)" || echo "   Nenhuma porta em uso"
}

# Função para mostrar logs
show_logs() {
    local environment=$1
    echo "📝 Logs do ambiente $environment"
    echo "Pressione Ctrl+C para sair"
    echo ""
    
    if [ "$environment" = "staging" ]; then
        docker-compose -f ../docker-compose.staging.yml logs -f
    elif [ "$environment" = "production" ]; then
        docker-compose -f ../docker-compose.production.yml logs -f
    fi
}

# Função para backup
backup_data() {
    echo "💾 Iniciando backup de dados..."
    ./backup.sh
}

# Função para limpar volumes
clean_volumes() {
    echo "⚠️  ATENÇÃO: Esta operação irá remover TODOS os dados!"
    read -p "Você tem certeza? Digite 'SIM' para confirmar: " -r
    if [[ $REPLY =~ ^SIM$ ]]; then
        echo "🗑️ Removendo volumes..."
        docker-compose -f ../docker-compose.staging.yml down -v
        docker-compose -f ../docker-compose.production.yml down -v
        docker volume prune -f
        echo "✅ Volumes removidos"
    else
        echo "❌ Operação cancelada"
    fi
}

# Loop principal
while true; do
    show_menu
    read -p "Digite sua opção: " -r choice
    
    case $choice in
        1)
            start_staging
            ;;
        2)
            start_production
            ;;
        3)
            stop_staging
            ;;
        4)
            stop_production
            ;;
        5)
            stop_all
            ;;
        6)
            show_status
            ;;
        7)
            show_logs "staging"
            ;;
        8)
            show_logs "production"
            ;;
        9)
            backup_data
            ;;
        10)
            clean_volumes
            ;;
        0)
            echo "👋 Saindo..."
            exit 0
            ;;
        *)
            echo "❌ Opção inválida"
            ;;
    esac
    
    echo ""
    read -p "Pressione Enter para continuar..."
done 