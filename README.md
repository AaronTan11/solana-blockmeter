# Solana BlockMeter

A real-time Solana blockchain data application that provides instant transaction counts and block metadata with intelligent caching for optimal performance.

![Solana BlockMeter](https://img.shields.io/badge/Solana-BlockMeter-9945FF?style=for-the-badge&logo=solana)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)

## 🌟 Features

- **Real-time Block Data**: Fetch live transaction counts and metadata from Solana blockchain
- **Lightning Fast**: Redis caching with 10-minute TTL for optimal performance
- **Modern UI**: Beautiful, responsive interface built with Next.js and Tailwind CSS
- **Production Ready**: Deployed with PM2, Nginx, and SSL/HTTPS support
- **Scalable Architecture**: Monorepo structure with separate frontend and API services

## 🏗️ Architecture

```
solana-blockmeter/
├── apps/
│   ├── api/              # NestJS Backend API
│   └── web/              # Next.js Frontend
├── packages/             # Shared packages (future)
├── nginx.conf           # Nginx configuration
├── ecosystem.config.js  # PM2 configuration
└── deploy-ec2.sh       # Deployment script
```

## 🚀 Tech Stack

### Frontend (Next.js)
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS
- **UI Components**: Custom shadcn/ui components
- **TypeScript**: Full type safety

### Backend (NestJS)
- **Framework**: NestJS with Express
- **Blockchain**: Solana Web3.js integration
- **Caching**: Redis with @keyv/redis
- **Configuration**: Environment-based config
- **TypeScript**: Full type safety

### Infrastructure
- **Process Manager**: PM2 for production
- **Reverse Proxy**: Nginx with SSL/HTTPS
- **Caching**: Redis (AWS ElastiCache)
- **Hosting**: AWS EC2
- **Domain**: SSL certificates via Let's Encrypt

## 📦 Installation

### Prerequisites
- Node.js 18+
- pnpm 8+
- Redis server
- PM2 (for production)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd solana-blockmeter
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Setup**
   
   Create `.env` in the root:
   ```env
   DATABASE_URL="your-database-url"
   REDIS_HOST="localhost"
   REDIS_PORT=6379
   SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
   SOLANA_COMMITMENT_LEVEL="confirmed"
   NEXT_PUBLIC_API_URL="http://localhost:3000"
   ```

   Create `apps/api/.env`:
   ```env
   # Solana Configuration
   SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
   SOLANA_COMMITMENT_LEVEL="confirmed"

   # Redis Configuration
   REDIS_HOST="localhost"
   REDIS_PORT="6379"
   ```

4. **Start Development Servers**
   ```bash
   # Terminal 1: Start API
   cd apps/api
   pnpm run start:dev

   # Terminal 2: Start Frontend
   cd apps/web
   pnpm run dev
   ```

5. **Access the Application**
   - Frontend: http://localhost:3001
   - API: http://localhost:3000

## 🔧 API Endpoints

### Get Block Data
```http
GET /blocks/:blockNumber
```

**Example Request:**
```bash
curl http://localhost:3000/blocks/359490350
```

**Example Response:**
```json
{
  "blockNumber": 359490350,
  "transactionCount": 1351,
  "blockhash": "7MaczBCaKp2oNbYnWpQ6gDXw49CKig8DfNdTHRK3PQGE",
  "timestamp": 1754974233
}
```

### Health Check
```http
GET /health
```

## 🚀 Deployment

### Production Deployment (EC2 + PM2)

1. **Server Setup**
   ```bash
   # Run the setup script on your EC2 instance
   ./setup-ec2.sh
   ```

2. **Environment Configuration**
   Update `.env` with production values:
   ```env
   REDIS_HOST="your-redis-cluster-endpoint"
   NEXT_PUBLIC_API_URL="https://yourdomain.com"
   ```

3. **Deploy**
   ```bash
   ./deploy-ec2.sh
   ```

4. **SSL Setup**
   ```bash
   # Install Certbot
   sudo yum install -y certbot python3-certbot-nginx
   
   # Get SSL certificate
   sudo certbot --nginx -d yourdomain.com
   ```

### PM2 Process Management

```bash
# View status
pm2 status

# View logs
pm2 logs

# Restart services
pm2 restart all

# Monitor
pm2 monit
```

## 📊 Performance

- **First Request**: ~2-3 seconds (Solana RPC fetch)
- **Cached Requests**: ~50-100ms (Redis cache)
- **Cache TTL**: 10 minutes
- **Fallback**: In-memory cache if Redis unavailable

## 🔒 Security Features

- **HTTPS/SSL**: Let's Encrypt certificates
- **CORS**: Configured for specific origins
- **Rate Limiting**: Nginx-level protection
- **Security Headers**: XSS, CSRF, and other protections

## 🛠️ Development

### Available Scripts

**Root:**
```bash
pnpm install    # Install all dependencies
pnpm build      # Build all applications
```

**API (apps/api):**
```bash
pnpm run start:dev    # Development server
pnpm run build        # Build for production
pnpm run start:prod   # Production server
pnpm run test         # Run tests
```

**Web (apps/web):**
```bash
pnpm run dev         # Development server
pnpm run build       # Build for production
pnpm run start       # Production server
```

### Project Structure

```
apps/api/src/
├── blocks/              # Block-related endpoints
│   ├── blocks.controller.ts
│   ├── blocks.service.ts
│   └── blocks.module.ts
├── config/              # Configuration modules
├── main.ts             # Application entry point
└── app.module.ts       # Root module

apps/web/
├── app/                # Next.js App Router
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Homepage
├── components/         # React components
│   └── ui/            # UI components
└── lib/               # Utilities
    ├── api.ts         # API client
    └── utils.ts       # Helper functions
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SOLANA_RPC_URL` | Solana RPC endpoint | `https://api.mainnet-beta.solana.com` |
| `SOLANA_COMMITMENT_LEVEL` | Commitment level for transactions | `confirmed` |
| `REDIS_HOST` | Redis server hostname | `localhost` |
| `REDIS_PORT` | Redis server port | `6379` |
| `NEXT_PUBLIC_API_URL` | Public API URL for frontend | `http://localhost:3000` |

### Nginx Configuration

The application uses Nginx as a reverse proxy with:
- SSL/HTTPS termination
- Rate limiting
- Static file serving
- API routing (`/api/*` → backend)
- Frontend serving (`/*` → Next.js)

## 🚨 Troubleshooting

### Common Issues

1. **API Connection Errors**
   ```bash
   # Check PM2 status
   pm2 status
   pm2 logs solana-blockmeter-api
   ```

2. **Frontend Build Issues**
   ```bash
   # Clear Next.js cache
   cd apps/web
   rm -rf .next
   pnpm run build
   ```

3. **Redis Connection Issues**
   ```bash
   # Test Redis connection
   redis-cli ping
   ```

4. **SSL Certificate Issues**
   ```bash
   # Renew certificates
   sudo certbot renew
   sudo systemctl reload nginx
   ```

## 📈 Monitoring

### Health Checks
- API Health: `GET /health`
- Frontend: Homepage availability
- Redis: Connection status in logs

### Logs
```bash
# Application logs
pm2 logs

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

## 📋 TODO / Known Issues

### 🚧 **Currently Disabled Features temporarily**
So there are some features that are commented out in the codebase and need to be re-enabled:


- **Database Integration (Prisma + RDS)**
  - [ ] Prisma ORM integration currently disabled in `app.module.ts`
  - [ ] PostgreSQL RDS database connection issues
  - [ ] Block data persistence to database
  - [ ] Historical data storage and retrieval

- **Background Job Processing (BullMQ)**
  - [ ] Background job queue system disabled
  - [ ] Async block data processing not working
  - [ ] Job retry mechanisms not active
  - [ ] Queue monitoring dashboard missing

- **Redis Caching (ElastiCache)**
  - [ ] Redis connection issues with AWS ElastiCache
  - [ ] Currently using in-memory caching as fallback
  - [ ] Redis URL configuration problems (double port issue)
  - [ ] Distributed caching not working across instances

### 🔧 **Planned Improvements**

- **Infrastructure**
  - [ ] Fix AWS RDS security group configuration
  - [ ] Resolve Redis ElastiCache connection issues
  - [ ] Implement proper environment variable loading
  - [ ] Add CloudFront CDN setup
  - [ ] Database connection pooling optimization


- **DevOps**
  - [ ] Automated deployment pipeline
  - [ ] Health check endpoints improvement
  - [ ] Monitoring and alerting setup
  - [ ] Log aggregation and analysis
  - [ ] Backup and recovery procedures


### ⚠️ **Current Limitations**

- **No Data Persistence**: Block data is only cached, not stored permanently
- **Single Instance**: No horizontal scaling due to in-memory cache
- **No Background Processing**: All API calls are synchronous
- **Limited Error Handling**: Some edge cases not covered
- **No User Management**: No authentication or user-specific features

### 🎯 **Priority Fixes**

1. **High Priority**
   - [ ] Fix database connection and enable Prisma
   - [ ] Resolve Redis ElastiCache integration

2. **Medium Priority**
   - [ ] Re-enable background job processing

3. **Low Priority**
   - [ ] Improve frontend UX/UI
   - [ ] Add documentation for developers



### That's it! Thanks for viewing and considering this project as application to the JD 🫶
