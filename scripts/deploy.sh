#!/bin/bash

# Deploy script for MILAPP
set -e

echo "🚀 Starting MILAPP deployment..."

# Build the application
echo "📦 Building application..."
npm run build

# Run tests
echo "🧪 Running tests..."
npm run test:coverage

# Build Docker image
echo "🐳 Building Docker image..."
docker build -t milapp:latest .

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Start new containers
echo "▶️ Starting new containers..."
docker-compose up -d

# Health check
echo "🏥 Performing health check..."
sleep 10
curl -f http://localhost:3000/health || exit 1

echo "✅ Deployment completed successfully!"
echo "🌐 Application available at: http://localhost:3000" 