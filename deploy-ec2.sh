#!/bin/bash

# Solana BlockMeter EC2 Deployment Script
echo "🚀 Starting Solana BlockMeter EC2 deployment..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating from .env.production template..."
    cp .env.production .env
    echo "📝 Please edit .env with your credentials before running again."
    exit 1
fi

# Source environment variables
set -a
source .env
set +a

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Create logs directory
echo "📁 Creating logs directory..."
mkdir -p logs

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

# Build API
echo "🔨 Building API..."
cd apps/api
pnpm prisma generate
pnpm run build
cd ../..

# Build Web
echo "🔨 Building Web..."
cd apps/web
pnpm run build
cd ../..

# Stop existing PM2 processes
echo "🛑 Stopping existing PM2 processes..."
pm2 stop ecosystem.config.js || true
pm2 delete ecosystem.config.js || true

# Run database migrations
echo "🗃️  Running database migrations..."
cd apps/api
pnpm prisma migrate deploy
cd ../..

# Start applications with PM2
echo "🚀 Starting applications with PM2..."
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
echo "💾 Saving PM2 configuration..."
pm2 save

# Setup PM2 startup script
echo "⚙️  Setting up PM2 startup script..."
pm2 startup || echo "ℹ️  Please run the startup command manually if needed"

# Show PM2 status
echo "📊 PM2 Status:"
pm2 status

echo "✅ Deployment complete!"
echo "🌐 Frontend: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):3001"
echo "📡 API: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):3000"
echo "📊 PM2 Monitor: pm2 monit"
echo "📋 PM2 Logs: pm2 logs"
