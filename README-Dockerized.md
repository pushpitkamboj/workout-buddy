# Fitness Tracker 2.0 - Fully Dockerized Microservices

A complete fitness tracking application built with a microservices architecture, featuring load balancing, rate limiting, and containerized deployment.

## 🏗️ Architecture

```
                    ┌─────────────────┐
                    │   Nginx Load    │
                    │    Balancer     │ :8080
                    │  (api.localhost)│
                    └─────────────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
         ┌─────────┐   ┌─────────┐   ┌─────────┐
         │Gateway-1│   │Gateway-2│   │Gateway-3│
         │  :3001  │   │  :3002  │   │  :3003  │
         └─────────┘   └─────────┘   └─────────┘
              │              │              │
              └──────────────┼──────────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
         ┌─────────┐   ┌─────────┐   ┌─────────┐
         │  User   │   │ Workout │   │ Redis   │
         │Service  │   │Service  │   │         │
         │  :3005  │   │  :3006  │   │  :6379  │
         └─────────┘   └─────────┘   └─────────┘
              │              │
              └──────────────┘
                     │
              ┌─────────────┐
              │ PostgreSQL  │
              │(Neon.tech)  │
              │ Serverless  │
              └─────────────┘
```

## 🚀 Services

### Core Services
- **Nginx Load Balancer** - Distributes traffic across API Gateway instances
- **API Gateway (3 instances)** - Request routing, rate limiting, authentication
- **User Service** - User management, authentication, profiles
- **Workout Service** - Workout tracking and management
- **Redis** - Shared rate limiting and caching
- **Shared Package** - Common utilities and Prisma database client

### External Dependencies
- **PostgreSQL** - Hosted on Neon.tech (serverless)

## 📦 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)
- Git

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd Fitness-Tracker2
```

### 2. Environment Setup
Create `.env` files in the following locations:
- `packages/shared/.env` - Database connection
- `packages/user-service/.env` - User service config
- `packages/workout-service/.env` - Workout service config
- `packages/api-gateway/.env` - Gateway config

#### packages/shared/.env
```env
DATABASE_URL="postgresql://username:password@host/database?sslmode=require"
```

#### packages/user-service/.env
```env
PORT=3005
JWT_SECRET=your-jwt-secret
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

#### packages/workout-service/.env
```env
PORT=3006
JWT_SECRET=your-jwt-secret
```

#### packages/api-gateway/.env
```env
PORT=3000
REDIS_URL=redis://redis:6379
```

### 3. Add to Hosts File
Add this line to your hosts file:
```
127.0.0.1 api.localhost
```

**Windows:** `C:\Windows\System32\drivers\etc\hosts`
**Linux/Mac:** `/etc/hosts`

### 4. Deploy the System

#### Option A: PowerShell (Windows)
```powershell
.\deploy.ps1
```

#### Option B: Bash (Linux/Mac/WSL)
```bash
chmod +x deploy.sh
./deploy.sh
```

#### Option C: Manual Docker Compose
```bash
# Stop any existing containers
docker-compose down

# Build and start all services
docker-compose up --build -d

# Check status
docker-compose ps
```

## 🌐 API Endpoints

### Main Entry Point
All requests should go through the load balancer: `http://api.localhost:8080`

### Authentication
```bash
# User Signup
POST http://api.localhost:8080/api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe"
}

# User Login
POST http://api.localhost:8080/api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

### User Management
```bash
# Get User Profile
GET http://api.localhost:8080/api/user/profile
Authorization: Bearer <jwt-token>

# Update Profile
PUT http://api.localhost:8080/api/user/profile
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "Updated Name",
  "age": 25
}
```

### Workout Management
```bash
# Create Workout
POST http://api.localhost:8080/api/workout/create
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "Morning Run",
  "exercises": [
    {
      "name": "Running",
      "duration": 30,
      "calories": 300
    }
  ]
}

# Get User Workouts
GET http://api.localhost:8080/api/workout/user
Authorization: Bearer <jwt-token>
```

## 🔧 Development

### Local Development (Without Docker)
If you want to run services locally for development:

```bash
# Install dependencies
npm install

# Start Redis (required for rate limiting)
docker run -d -p 6379:6379 redis:7-alpine

# Start User Service
cd packages/user-service
npm run dev

# Start Workout Service (in new terminal)
cd packages/workout-service
npm run dev

# Start API Gateway (in new terminal)
cd packages/api-gateway
npm run dev
```

### Database Management
```bash
# Generate Prisma Client
cd packages/shared
npm run prisma:generate

# Run Migrations
npm run prisma:migrate

# Open Prisma Studio
npm run prisma:studio
```

## 📊 Monitoring & Debugging

### Health Checks
```bash
# Load Balancer Health
curl http://api.localhost:8080/nginx-health

# API Gateway Health (load balanced)
curl http://api.localhost:8080/health

# Individual Service Health
curl http://localhost:3005/health  # User Service
curl http://localhost:3006/health  # Workout Service
```

### Logs
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f user-service
docker-compose logs -f api-gateway-1
docker-compose logs -f nginx-lb
```

### Container Status
```bash
# Check running containers
docker-compose ps

# View resource usage
docker stats
```

## 🔒 Security Features

- **Rate Limiting**: Redis-based rate limiting (100 req/15min general, 20 req/15min auth)
- **Helmet.js**: Security headers on all requests
- **JWT Authentication**: Secure user sessions
- **Input Validation**: Request validation using Joi
- **CORS Protection**: Configured CORS policies

## 🚦 Rate Limits

- **General endpoints**: 100 requests per 15 minutes per IP
- **Authentication endpoints**: 20 requests per 15 minutes per IP
- **Shared across all gateway instances** via Redis

## 🛠️ Technology Stack

- **Runtime**: Node.js 18
- **Framework**: Express.js
- **Database**: PostgreSQL (Neon.tech)
- **ORM**: Prisma
- **Authentication**: JWT
- **Rate Limiting**: Redis
- **Load Balancer**: Nginx
- **Containerization**: Docker
- **Language**: TypeScript

## 📁 Project Structure

```
Fitness-Tracker2/
├── packages/
│   ├── api-gateway/           # API Gateway service
│   ├── user-service/          # User management service
│   ├── workout-service/       # Workout tracking service
│   └── shared/               # Shared utilities & Prisma
├── nginx.conf                # Nginx configuration
├── docker-compose.yml        # Docker services definition
├── deploy.sh                 # Linux/Mac deployment script
├── deploy.ps1               # Windows deployment script
└── README.md                # This file
```

## 🔧 Troubleshooting

### Common Issues

1. **Port 80 conflicts**: If Apache is running, stop it or use port 8080
2. **Database connection**: Ensure DATABASE_URL is correct in shared/.env
3. **Redis connection**: Ensure Redis container is running
4. **DNS resolution**: Add api.localhost to hosts file

### Reset Everything
```bash
# Stop and remove all containers
docker-compose down --volumes --remove-orphans

# Remove all images
docker-compose down --rmi all

# Rebuild from scratch
docker-compose up --build -d
```

## 📝 Environment Variables

### Required Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT token signing
- `REDIS_URL` - Redis connection string
- `EMAIL_USER` & `EMAIL_PASS` - For email notifications

### Optional Environment Variables
- `NODE_ENV` - Environment (development/production)
- `PORT` - Service port (defaults provided)
- `GATEWAY_ID` - Gateway instance identifier

## 🎯 Next Steps

1. Add monitoring with Prometheus/Grafana
2. Implement API documentation with Swagger
3. Add automated testing pipeline
4. Set up staging/production environments
5. Add backup strategies for Redis/Database
6. Implement circuit breakers
7. Add distributed tracing
