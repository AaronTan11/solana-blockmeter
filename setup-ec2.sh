#!/bin/bash

# EC2 Initial Setup Script for Solana BlockMeter
echo "🔧 Setting up EC2 instance for Solana BlockMeter..."

# Update system packages
echo "📦 Updating system packages..."
sudo yum update -y

# Install Node.js 18
echo "📦 Installing Node.js 18..."
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install pnpm
echo "📦 Installing pnpm..."
sudo npm install -g pnpm

# Install PM2
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Install Nginx
echo "📦 Installing Nginx..."
sudo yum install -y nginx

# Install Git (if not already installed)
echo "📦 Installing Git..."
sudo yum install -y git

# Create application user
echo "👤 Creating application user..."
sudo useradd -m -s /bin/bash solana-app || echo "User already exists"

# Create application directory
echo "📁 Creating application directory..."
sudo mkdir -p /opt/solana-blockmeter
sudo chown solana-app:solana-app /opt/solana-blockmeter

# Setup nginx configuration
echo "⚙️  Setting up Nginx configuration..."
sudo cp nginx-ec2.conf /etc/nginx/nginx.conf
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl start nginx

# Create logs directory
echo "📁 Creating logs directory..."
sudo mkdir -p /var/log/solana-blockmeter
sudo chown solana-app:solana-app /var/log/solana-blockmeter

# Setup PM2 log rotation
echo "📋 Setting up PM2 log rotation..."
sudo -u solana-app pm2 install pm2-logrotate

# Enable services
echo "🚀 Enabling services..."
sudo systemctl enable nginx

echo "✅ EC2 setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Switch to application user: sudo su - solana-app"
echo "2. Clone the repository: git clone <your-repo-url>"
echo "3. Copy your .env file with the correct credentials"
echo "4. Run the deployment script: ./deploy-ec2.sh"
echo ""
echo "🌐 Your server will be available at:"
echo "   Frontend: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
echo "   API: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)/api/"
