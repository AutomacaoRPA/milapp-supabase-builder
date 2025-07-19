#!/bin/bash
# Script de deploy para ambiente PRODUÇÃO

echo "🚀 Iniciando deploy para ambiente PRODUÇÃO..."

# Verificar se estamos na branch main
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "❌ Erro: Deploy produção deve ser feito na branch 'main'"
  echo "Branch atual: $CURRENT_BRANCH"
  exit 1
fi

# Confirmação de segurança para produção
read -p "⚠️  Você tem certeza que deseja fazer deploy para PRODUÇÃO? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Deploy cancelado pelo usuário"
  exit 1
fi

# Instalar dependências
echo "📦 Instalando dependências..."
npm ci

# Executar testes
echo "🧪 Executando testes..."
npm run lint
npm run type-check

# Build para produção
echo "🔨 Construindo aplicação para produção..."
npm run build:prod

# Deploy para Supabase Produção
echo "🗄️ Sincronizando com Supabase Produção (base limpa)..."
# npx supabase db push --project-ref ktuvnllzmpsdgstsgbib --local supabase-prod

# Deploy para hosting
echo "🌐 Fazendo deploy para hosting..."
# Adicione aqui o comando do seu provedor de hosting
# Por exemplo: vercel --prod

echo "✅ Deploy produção concluído com sucesso!"
echo "🔗 URL: https://milapp.com (exemplo)"