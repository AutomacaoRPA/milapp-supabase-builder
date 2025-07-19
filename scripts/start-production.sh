#!/bin/bash

# Script para iniciar ambiente de Produção
echo "🚀 Iniciando ambiente de Produção..."

# Carregar variáveis de ambiente
if [ -f "../env.production" ]; then
    export $(cat ../env.production | grep -v '^#' | xargs)
    echo "✅ Variáveis de ambiente carregadas"
else
    echo "❌ Arquivo env.production não encontrado"
    exit 1
fi

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando"
    exit 1
fi

# Verificar se é ambiente de produção
read -p "⚠️  Você está certo de que quer iniciar o ambiente de PRODUÇÃO? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Operação cancelada"
    exit 1
fi

# Parar containers existentes se houver
echo "🛑 Parando containers existentes..."
docker-compose -f ../docker-compose.production.yml down

# Backup antes de iniciar (opcional)
read -p "Deseja fazer backup antes de iniciar? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "💾 Fazendo backup..."
    ./backup.sh
fi

# Construir e iniciar containers
echo "🔨 Construindo containers..."
docker-compose -f ../docker-compose.production.yml build

echo "🚀 Iniciando serviços..."
docker-compose -f ../docker-compose.production.yml up -d

# Aguardar serviços ficarem prontos
echo "⏳ Aguardando serviços ficarem prontos..."
sleep 60

# Verificar status dos serviços
echo "🔍 Verificando status dos serviços..."
docker-compose -f ../docker-compose.production.yml ps

# Testar endpoints
echo "🧪 Testando endpoints..."
echo "Backend: http://localhost:8000/health"
curl -f http://localhost:8000/health || echo "❌ Backend não está respondendo"

echo "Frontend: http://localhost:3000"
curl -f http://localhost:3000 || echo "❌ Frontend não está respondendo"

echo "Grafana: http://localhost:3001"
curl -f http://localhost:3001 || echo "❌ Grafana não está respondendo"

echo "Prometheus: http://localhost:9090"
curl -f http://localhost:9090 || echo "❌ Prometheus não está respondendo"

# Verificar replicas
echo "🔍 Verificando replicas..."
docker-compose -f ../docker-compose.production.yml ps | grep -E "(backend-production|frontend-production)"

echo ""
echo "🎉 Ambiente de Produção iniciado com sucesso!"
echo ""
echo "📋 URLs dos serviços:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8000"
echo "   Dashboard: http://localhost:8501"
echo "   Grafana: http://localhost:3001"
echo "   Prometheus: http://localhost:9090"
echo "   MinIO Console: http://localhost:9001"
echo ""
echo "📝 Logs: docker-compose -f ../docker-compose.production.yml logs -f"
echo "🛑 Parar: docker-compose -f ../docker-compose.production.yml down"
echo ""
echo "⚠️  Lembre-se: Este é o ambiente de PRODUÇÃO!" 