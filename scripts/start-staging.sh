#!/bin/bash

# Script para iniciar ambiente de Staging/Demo
echo "🚀 Iniciando ambiente de Staging/Demo..."

# Carregar variáveis de ambiente
if [ -f "../env.staging" ]; then
    export $(cat ../env.staging | grep -v '^#' | xargs)
    echo "✅ Variáveis de ambiente carregadas"
else
    echo "❌ Arquivo env.staging não encontrado"
    exit 1
fi

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando"
    exit 1
fi

# Parar containers existentes se houver
echo "🛑 Parando containers existentes..."
docker-compose -f ../docker-compose.staging.yml down

# Remover volumes antigos (opcional)
read -p "Deseja remover volumes antigos? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️ Removendo volumes antigos..."
    docker-compose -f ../docker-compose.staging.yml down -v
fi

# Construir e iniciar containers
echo "🔨 Construindo containers..."
docker-compose -f ../docker-compose.staging.yml build

echo "🚀 Iniciando serviços..."
docker-compose -f ../docker-compose.staging.yml up -d

# Aguardar serviços ficarem prontos
echo "⏳ Aguardando serviços ficarem prontos..."
sleep 30

# Verificar status dos serviços
echo "🔍 Verificando status dos serviços..."
docker-compose -f ../docker-compose.staging.yml ps

# Testar endpoints
echo "🧪 Testando endpoints..."
echo "Backend: http://localhost:8001/health"
curl -f http://localhost:8001/health || echo "❌ Backend não está respondendo"

echo "Frontend: http://localhost:3001"
curl -f http://localhost:3001 || echo "❌ Frontend não está respondendo"

echo "Grafana: http://localhost:3002"
curl -f http://localhost:3002 || echo "❌ Grafana não está respondendo"

echo "Prometheus: http://localhost:9091"
curl -f http://localhost:9091 || echo "❌ Prometheus não está respondendo"

echo ""
echo "🎉 Ambiente de Staging/Demo iniciado com sucesso!"
echo ""
echo "📋 URLs dos serviços:"
echo "   Frontend: http://localhost:3001"
echo "   Backend API: http://localhost:8001"
echo "   Dashboard: http://localhost:8502"
echo "   Grafana: http://localhost:3002 (admin/admin-staging)"
echo "   Prometheus: http://localhost:9091"
echo "   MinIO Console: http://localhost:9003"
echo ""
echo "📝 Logs: docker-compose -f ../docker-compose.staging.yml logs -f"
echo "🛑 Parar: docker-compose -f ../docker-compose.staging.yml down" 