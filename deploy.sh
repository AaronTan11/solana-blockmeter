#!/bin/bash

# Solana BlockMeter Deployment Script
echo "🚀 Starting Solana BlockMeter deployment..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating from .env.production template..."
    cp .env.production .env
    echo "📝 Please edit .env with your AWS credentials before running again."
    exit 1
fi

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Build and start services
echo "🔨 Building and starting Docker containers..."
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Check health
echo "🏥 Checking service health..."
echo "API Health:"
curl -f http://localhost:3000/ || echo "❌ API not responding"

echo -e "\nFrontend Health:"
curl -f http://localhost:3001/ || echo "❌ Frontend not responding"

echo -e "\nNginx Health:"
curl -f http://localhost/health || echo "❌ Nginx not responding"

# Run database migrations
echo "🗃️  Running database migrations..."
docker-compose exec nestjs-api npx prisma migrate deploy

echo "✅ Deployment complete!"
echo "🌐 Frontend: http://localhost"
echo "📡 API: http://localhost/blocks/{blockNumber}"
echo "📊 Admin: docker-compose logs -f"
