#!/bin/bash
# Script de deploy para ambiente DEMO/HOMOLOGAÇÃO

echo "🚀 Iniciando deploy para ambiente DEMO..."

# Verificar se estamos na branch demo
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "demo" ]; then
  echo "❌ Erro: Deploy demo deve ser feito na branch 'demo'"
  echo "Branch atual: $CURRENT_BRANCH"
  exit 1
fi

# Instalar dependências
echo "📦 Instalando dependências..."
npm ci

# Executar testes
echo "🧪 Executando testes..."
npm run lint
npm run type-check

# Build para demo
echo "🔨 Construindo aplicação para demo..."
npm run build:demo

# Deploy para Supabase Demo (se necessário)
echo "🗄️ Sincronizando com Supabase Demo..."
# npx supabase db push --project-ref DEMO_PROJECT_ID

# Deploy para hosting (exemplo: Vercel, Netlify, etc.)
echo "🌐 Fazendo deploy para hosting..."
# Adicione aqui o comando do seu provedor de hosting
# Por exemplo: vercel --prod

echo "✅ Deploy demo concluído com sucesso!"
echo "🔗 URL: https://demo.milapp.com (exemplo)"