# Build stage
FROM node:18-alpine AS builder

LABEL maintainer="MedSênior - Centro de Excelência"
LABEL description="MILAPP - Plataforma CoE Automação"
LABEL version="2.0.0"

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY src/ ./src/
COPY public/ ./public/
COPY index.html ./

# Build application with MedSênior optimizations
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy MedSênior nginx configuration
COPY nginx-medsenior.conf /etc/nginx/nginx.conf

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Add health check endpoint
RUN echo '{"status":"healthy","service":"milapp-medsenior","message":"bem funcionando"}' > /usr/share/nginx/html/health.json

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health.json || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"] 