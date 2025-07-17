#!/bin/bash

echo "🚀 MILAPP v2.0 - Setup de Desenvolvimento"
echo "=========================================="

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não está instalado. Por favor, instale o Docker primeiro."
    exit 1
fi

# Verificar se Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não está instalado. Por favor, instale o Docker Compose primeiro."
    exit 1
fi

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não está instalado. Por favor, instale o Node.js primeiro."
    exit 1
fi

echo "✅ Dependências verificadas"

# Criar arquivo .env se não existir
if [ ! -f .env ]; then
    echo "📝 Criando arquivo .env..."
    cp env.example .env
    echo "⚠️  Por favor, configure as variáveis de ambiente no arquivo .env"
fi

# Instalar dependências do frontend
echo "📦 Instalando dependências do frontend..."
npm install

# Iniciar serviços com Docker Compose
echo "🐳 Iniciando serviços com Docker Compose..."
docker-compose up -d

# Aguardar serviços iniciarem
echo "⏳ Aguardando serviços iniciarem..."
sleep 30

# Verificar status dos serviços
echo "🔍 Verificando status dos serviços..."

# Verificar backend
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Backend está rodando em http://localhost:8000"
else
    echo "❌ Backend não está respondendo"
fi

# Verificar frontend
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend está rodando em http://localhost:3000"
else
    echo "❌ Frontend não está respondendo"
fi

# Verificar PostgreSQL
if docker-compose exec postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo "✅ PostgreSQL está rodando"
else
    echo "❌ PostgreSQL não está respondendo"
fi

# Verificar Redis
if docker-compose exec redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis está rodando"
else
    echo "❌ Redis não está respondendo"
fi

echo ""
echo "🎉 Setup concluído!"
echo ""
echo "📋 Próximos passos:"
echo "1. Configure as variáveis de ambiente no arquivo .env"
echo "2. Acesse http://localhost:3000 para o frontend"
echo "3. Acesse http://localhost:8000/docs para a documentação da API"
echo "4. Acesse http://localhost:54321 para o Supabase Studio"
echo "5. Acesse http://localhost:9090 para o Prometheus"
echo "6. Acesse http://localhost:3001 para o Grafana (admin/admin)"
echo ""
echo "🔧 Comandos úteis:"
echo "- docker-compose logs -f [serviço]  # Ver logs de um serviço"
echo "- docker-compose down              # Parar todos os serviços"
echo "- docker-compose restart [serviço] # Reiniciar um serviço"
echo ""
echo "📚 Documentação: https://github.com/AutomacaoRPA/milapp-supabase-builder" 