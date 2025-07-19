# Multi-stage build para otimização e segurança
FROM node:18-alpine AS base

# Configurar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Instalar dependências de sistema necessárias
RUN apk add --no-cache \
    dumb-init \
    curl \
    && rm -rf /var/cache/apk/*

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY tsconfig*.json ./

# Stage de dependências
FROM base AS deps

# Instalar dependências de produção e desenvolvimento
RUN npm ci --only=production && npm cache clean --force

# Stage de build
FROM base AS builder

# Copiar dependências do stage anterior
COPY --from=deps /app/node_modules ./node_modules

# Copiar código fonte
COPY . .

# Configurar variáveis de ambiente para build
ENV NODE_ENV=production
ENV CI=true
ENV GENERATE_SOURCEMAP=false

# Executar build
RUN npm run build

# Stage de produção
FROM nginx:alpine AS production

# Instalar dependências de segurança
RUN apk add --no-cache \
    curl \
    dumb-init \
    && rm -rf /var/cache/apk/*

# Criar usuário não-root
RUN addgroup -g 1001 -S nginx && \
    adduser -S nginx -u 1001

# Configurar nginx
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /app/build /usr/share/nginx/html

# Criar diretórios necessários e ajustar permissões
RUN mkdir -p /var/cache/nginx /var/log/nginx /var/run && \
    chown -R nginx:nginx /var/cache/nginx /var/log/nginx /var/run /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Expor porta
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# Usar dumb-init para gerenciar processos
ENTRYPOINT ["dumb-init", "--"]

# Comando para iniciar nginx
CMD ["nginx", "-g", "daemon off;"]

# Stage de desenvolvimento (opcional)
FROM base AS development

# Copiar dependências
COPY --from=deps /app/node_modules ./node_modules

# Copiar código fonte
COPY . .

# Configurar variáveis de ambiente para desenvolvimento
ENV NODE_ENV=development
ENV CHOKIDAR_USEPOLLING=true

# Expor porta de desenvolvimento
EXPOSE 3000

# Health check para desenvolvimento
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

# Usar dumb-init para gerenciar processos
ENTRYPOINT ["dumb-init", "--"]

# Comando para iniciar em modo de desenvolvimento
CMD ["npm", "start"]

# Stage de testes
FROM base AS test

# Copiar dependências
COPY --from=deps /app/node_modules ./node_modules

# Copiar código fonte
COPY . .

# Configurar variáveis de ambiente para testes
ENV NODE_ENV=test
ENV CI=true

# Executar testes
CMD ["npm", "test", "--", "--watchAll=false", "--coverage"]

# Labels para documentação
LABEL maintainer="MILAPP Team <dev@milapp.com>"
LABEL version="2.0.0"
LABEL description="Frontend do MILAPP - Centro de Excelência em Automação RPA"
LABEL org.opencontainers.image.source="https://github.com/milapp/frontend"
LABEL org.opencontainers.image.licenses="MIT" 