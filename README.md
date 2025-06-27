# 🏋️‍♂️ Fitness Tracker 2.0

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4.5-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-blue.svg)](https://www.docker.com/)
[![Redis](https://img.shields.io/badge/Redis-7.0-red.svg)](https://redis.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://www.postgresql.org/)

A production-ready, microservices-based fitness tracking application with enterprise-grade architecture featuring load balancing, distributed rate limiting, and horizontal scaling capabilities.

## 🌟 Features

- ✅ **Microservices Architecture** - Modular, scalable service design
- ✅ **Load Balancing** - NGINX-powered distribution across multiple API gateways
- ✅ **Distributed Rate Limiting** - Redis-based rate limiting across all instances
- ✅ **JWT Authentication** - Secure user authentication with refresh tokens
- ✅ **Email Verification** - Complete user verification workflow
- ✅ **Password Reset** - Secure password recovery system
- ✅ **Workout Tracking** - Comprehensive fitness data management
- ✅ **Real-time Notifications** - User notification system
- ✅ **Health Monitoring** - Built-in health checks for all services
- ✅ **Container Orchestration** - Docker Compose for easy deployment
- ✅ **Type Safety** - Full TypeScript implementation
- ✅ **Database Migrations** - Prisma-powered schema management

## 🏗️ Architecture

```mermaid
graph TB
    Client[Client Applications]
    
    subgraph "Load Balancer Layer"
        LB[NGINX Load Balancer<br/>Port: 8080]
    end
    
    subgraph "API Gateway Layer"
        GW1[API Gateway 1<br/>Port: 3001]
        GW2[API Gateway 2<br/>Port: 3002]
        GW3[API Gateway 3<br/>Port: 3003]
    end
    
    subgraph "Microservices Layer"
        US[User Service<br/>Port: 3005]
        WS[Workout Service<br/>Port: 3006]
    end
    
    subgraph "Data Layer"
        Redis[(Redis<br/>Rate Limiting & Cache)]
        DB[(PostgreSQL<br/>Primary Database)]
    end
    
    Client --> LB
    LB --> GW1
    LB --> GW2
    LB --> GW3
    
    GW1 --> US
    GW1 --> WS
    GW2 --> US
    GW2 --> WS
    GW3 --> US
    GW3 --> WS
    
    GW1 --> Redis
    GW2 --> Redis
    GW3 --> Redis
    
    US --> DB
    WS --> DB
```

## 🚀 Quick Start

### Prerequisites

- **Docker & Docker Compose** (v20.10+)
- **Node.js** (v18+) - For local development
- **Git** - For cloning the repository

### 1. Clone Repository

```bash
git clone https://github.com/your-username/fitness-tracker2.git
cd fitness-tracker2
```

### 2. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Configure your environment variables
# Edit .env with your specific configuration
```

#### Required Environment Variables

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/fitness_tracker"

# JWT Secrets (Generate secure keys)
JWT_SECRET=your_super_secure_jwt_secret_key_here_minimum_32_chars
JWT_REFRESH_SECRET=your_super_secure_refresh_secret_key_here_minimum_32_chars

# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password

# Redis Configuration
REDIS_URL=redis://redis:6379

# Environment
NODE_ENV=production
```

### 3. Deploy Services

#### Windows (PowerShell)
```powershell
.\deploy.ps1
```

#### Linux/macOS (Bash)
```bash
chmod +x deploy.sh
./deploy.sh
```

### 4. Verify Deployment

Once deployed, verify all services are running:

```bash
# Check overall health
curl http://localhost:8080/health

# Check individual gateways
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health

# Check services
curl http://localhost:3005/health
curl http://localhost:3006/health
```

## 🔌 API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/signup` | User registration |
| `POST` | `/api/auth/login` | User login |
| `POST` | `/api/auth/refresh` | Refresh access token |
| `POST` | `/api/auth/logout` | User logout |
| `POST` | `/api/auth/forgot-password` | Request password reset |
| `POST` | `/api/auth/reset-password` | Reset password |
| `POST` | `/api/auth/verify-email` | Verify email address |

### User Management Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/user/profile` | Get user profile |
| `PUT` | `/api/user/profile` | Update user profile |
| `GET` | `/api/user/notifications` | Get user notifications |
| `PUT` | `/api/user/notifications/:id` | Update notification |

### Workout Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/workout` | Get user workouts |
| `POST` | `/api/workout` | Create new workout |
| `GET` | `/api/workout/:id` | Get specific workout |
| `PUT` | `/api/workout/:id` | Update workout |
| `DELETE` | `/api/workout/:id` | Delete workout |

### Health Check Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Service health status |
| `GET` | `/nginx-health` | NGINX load balancer health |

## 🛡️ Security Features

### Rate Limiting

- **Global Rate Limiting**: 100 requests per 15 minutes per IP
- **Authentication Endpoints**: 20 requests per 15 minutes per IP
- **Distributed**: Shared across all API gateway instances via Redis

### Security Headers

- **Helmet.js**: Security headers implementation
- **CORS**: Cross-origin resource sharing protection
- **JWT**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds

### Input Validation

- **Joi Validation**: Schema-based request validation
- **Type Safety**: TypeScript for compile-time type checking
- **Sanitization**: Input sanitization for SQL injection prevention

## 📊 Monitoring & Logging

### Health Monitoring

All services expose health check endpoints:

```bash
# Check API Gateway health
curl http://localhost:3001/health

# Expected response:
{
  "status": "OK",
  "gateway": "gateway-1",
  "timestamp": "2025-06-26T12:00:00.000Z"
}
```

### Request Logging

- **Gateway Level**: Request routing and load balancing logs
- **Service Level**: Individual service request logs
- **NGINX Level**: Access and error logs

### Log Locations

```
logs/
├── nginx/
│   ├── access.log    # NGINX access logs
│   └── error.log     # NGINX error logs
└── [service-logs appear in Docker logs]
```

## 🏛️ Database Schema

### User Model

```sql
Table users {
  id                        String    [pk]
  email                     String    [unique]
  password                  String
  username                  String
  isVerified                Boolean   [default: false]
  verificationToken         String
  verificationTokenExpiry   DateTime
  refreshToken              String
  passwordResetToken        String
  passwordResetTokenExpiry  DateTime
  createdAt                 DateTime  [default: now()]
  updatedAt                 DateTime  [updatedAt]
}
```

### Workout Model

```sql
Table workouts {
  id           String       [pk]
  userId       String       [ref: > users.id]
  date         DateTime
  exerciseType ExerciseType
  duration     Int          // minutes
  calories     Int
}
```

### Notification Model

```sql
Table notifications {
  id        String   [pk]
  userId    String   [ref: > users.id]
  message   String
  isRead    Boolean  [default: false]
  createdAt DateTime [default: now()]
}
```

## 🔧 Development

### Local Development Setup

1. **Install dependencies**:
   ```bash
   npm install
   npx lerna bootstrap
   ```

2. **Setup database**:
   ```bash
   cd packages/shared
   npx prisma migrate dev
   npx prisma generate
   ```

3. **Start services individually**:
   ```bash
   # Terminal 1: User Service
   cd packages/user-service
   npm run dev

   # Terminal 2: Workout Service
   cd packages/workout-service
   npm run dev

   # Terminal 3: API Gateway
   cd packages/api-gateway
   npm run dev
   ```

### Available Scripts

```bash
# Install dependencies for all packages
npm run bootstrap

# Build all packages
npm run build

# Run tests
npm run test

# Lint code
npm run lint

# Deploy with Docker
npm run deploy
```

### Project Structure

```
fitness-tracker2/
├── packages/
│   ├── api-gateway/           # API Gateway service
│   │   ├── src/
│   │   ├── Dockerfile
│   │   └── package.json
│   ├── user-service/          # User management service
│   │   ├── src/
│   │   │   ├── auth/         # Authentication logic
│   │   │   ├── user-profile/ # Profile management
│   │   │   └── utils/        # Utility functions
│   │   ├── Dockerfile
│   │   └── package.json
│   ├── workout-service/       # Workout management service
│   │   ├── src/
│   │   │   ├── controllers/  # Request controllers
│   │   │   ├── routes/       # API routes
│   │   │   └── validation/   # Input validation
│   │   ├── Dockerfile
│   │   └── package.json
│   └── shared/               # Shared utilities and database
│       ├── prisma/          # Database schema and migrations
│       ├── generated/       # Generated Prisma client
│       └── package.json
├── logs/                     # Log files
├── docker-compose.yml        # Container orchestration
├── nginx.conf               # Load balancer configuration
├── deploy.ps1              # Windows deployment script
├── deploy.sh               # Unix deployment script
└── README.md               # This file
```

## 🔄 Load Balancing

### NGINX Configuration

The load balancer distributes requests across three API Gateway instances using round-robin algorithm:

```nginx
upstream api_gateways {
    server api-gateway-1:3000;
    server api-gateway-2:3000;
    server api-gateway-3:3000;
    keepalive 32;
}
```

### Testing Load Balancing

```bash
# Make multiple requests to see different gateways respond
for i in {1..6}; do
  curl -s http://localhost:8080/health | grep gateway
done

# Expected output shows rotation between gateway-1, gateway-2, gateway-3
```

## 🐳 Docker Services

| Service | Container Name | Port | Purpose |
|---------|----------------|------|---------|
| **nginx-lb** | fitness-nginx-lb | 8080 | Load balancer |
| **redis** | fitness-redis | 6379 | Rate limiting & cache |
| **user-service** | fitness-user-service | 3005 | User management |
| **workout-service** | fitness-workout-service | 3006 | Workout management |
| **api-gateway-1** | fitness-api-gateway-1 | 3001 | API Gateway instance 1 |
| **api-gateway-2** | fitness-api-gateway-2 | 3002 | API Gateway instance 2 |
| **api-gateway-3** | fitness-api-gateway-3 | 3003 | API Gateway instance 3 |

## 🚀 Scaling

### Horizontal Scaling

To add more API Gateway instances:

1. Add new service in `docker-compose.yml`:
   ```yaml
   api-gateway-4:
     build: 
       context: .
       dockerfile: packages/api-gateway/Dockerfile
     container_name: fitness-api-gateway-4
     environment:
       - GATEWAY_ID=gateway-4
     ports:
       - "3004:3000"
   ```

2. Update NGINX upstream configuration:
   ```nginx
   upstream api_gateways {
       server api-gateway-1:3000;
       server api-gateway-2:3000;
       server api-gateway-3:3000;
       server api-gateway-4:3000;  # New instance
   }
   ```

### Vertical Scaling

Adjust Docker resource limits in `docker-compose.yml`:

```yaml
services:
  api-gateway-1:
    deploy:
      resources:
        limits:
          cpus: '0.50'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
```

## 🧪 Testing

### API Testing Examples

```bash
# Test user registration
curl -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"securepassword123","username":"testuser"}'

# Test user login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"securepassword123"}'

# Test workout creation (requires authentication token)
curl -X POST http://localhost:8080/api/workout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"exerciseType":"CARDIO","duration":30,"calories":200,"date":"2025-06-26T10:00:00Z"}'
```

### Load Testing

```bash
# Install Apache Bench for load testing
sudo apt-get install apache2-utils

# Test with 100 concurrent requests
ab -n 1000 -c 100 http://localhost:8080/health
```

## 🛠️ Troubleshooting

### Common Issues

1. **Services not starting**:
   ```bash
   # Check Docker logs
   docker-compose logs [service-name]
   
   # Restart specific service
   docker-compose restart [service-name]
   ```

2. **Database connection issues**:
   ```bash
   # Check database connectivity
   docker-compose exec user-service npx prisma migrate status
   ```

3. **Redis connection issues**:
   ```bash
   # Test Redis connectivity
   docker-compose exec redis redis-cli ping
   ```

4. **Port conflicts**:
   ```bash
   # Check port usage
   netstat -tulpn | grep :8080
   
   # Stop conflicting services
   sudo systemctl stop nginx  # If system nginx is running
   ```

### Debug Commands

```bash
# View all running containers
docker-compose ps

# Follow logs for all services
docker-compose logs -f

# Execute commands in containers
docker-compose exec user-service sh
docker-compose exec redis redis-cli

# Check service health
docker-compose exec api-gateway-1 curl localhost:3000/health
```

## 📈 Performance Optimization

### Redis Optimization

```bash
# Redis memory usage
docker-compose exec redis redis-cli info memory

# Redis performance monitoring
docker-compose exec redis redis-cli monitor
```

### Database Optimization

```sql
-- Add indexes for better query performance
CREATE INDEX idx_workouts_user_id ON workouts(userId);
CREATE INDEX idx_workouts_date ON workouts(date);
CREATE INDEX idx_notifications_user_id ON notifications(userId);
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines

- **TypeScript**: Use strict type checking
- **ESLint**: Follow the established linting rules
- **Testing**: Write tests for new features
- **Documentation**: Update README for new features
- **Security**: Follow security best practices

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Express.js** - Fast, unopinionated web framework
- **Prisma** - Modern database toolkit
- **Redis** - In-memory data structure store
- **Docker** - Containerization platform
- **NGINX** - High-performance web server and load balancer
- **TypeScript** - Typed superset of JavaScript

## 📞 Support

For support and questions:

- **Create an Issue**: [GitHub Issues](https://github.com/your-username/fitness-tracker2/issues)
- **Documentation**: Check this README and inline code comments
- **Email**: pushpitkamboj@gmail.com

---

**Built with ❤️ by the Fitness Tracker Team**
