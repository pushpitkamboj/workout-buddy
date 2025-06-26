# Fitness Tracker 2.0 - Load Balanced Architecture

This setup implements an industrial-level load-balanced API gateway architecture with Redis-based rate limiting.

## Architecture Overview

```
                                 ┌─────────────────┐
                                 │                 │
                            ┌────►  API Gateway 1  ├────┐
                            │    │   (Port 3001)   │    │
                            │    └─────────────────┘    │
                            │                           │
┌─────────────┐             │    ┌─────────────────┐    │    ┌─────────────────┐
│             │             │    │                 │    │    │                 │
│ NGINX       ├─────────────┼────►  API Gateway 2  ├────┼─|───► User Service   │
│ Load        │             │    │   (Port 3002)   │    │ |  │   (Port 3005)   │
│ Balancer    │             │    └─────────────────┘    │ |  └─────────────────┘
│ (Port 80)   │             │                           │ |
└─────────────┘             │    ┌─────────────────┐    │ |
                            │    │                 │    │ |───► workout service
                            └────►  API Gateway 3  ├────┘
                                 │   (Port 3003)   │
                                 └─────────────────┘
                                           │
                                           │
                                  ┌─────────────────┐
                                  │     Redis       │
                                  │  (Port 6379)    │
                                  │ Rate Limiting   │
                                  └─────────────────┘
```

## Features

- **Load Balancing**: NGINX distributes requests across 3 API Gateway instances
- **Redis Rate Limiting**: Shared rate limiting across all gateway instances
- **Health Checks**: Built-in health monitoring for all services
- **Container Orchestration**: Docker Compose for easy deployment
- **Production Ready**: Includes security headers, logging, and error handling

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ (for local development)

### Deployment

1. **Clone and setup:**
   ```bash
   cd Fitness-Tracker2
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Deploy with PowerShell (Windows):**
   ```powershell
   .\deploy.ps1
   ```

   **Or with Bash (Linux/Mac):**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

## Service Endpoints

- **Load Balancer**: http://localhost (Routes to all gateways)
- **NGINX Health**: http://localhost/nginx-health
- **API Gateway 1**: http://localhost:3001/health
- **API Gateway 2**: http://localhost:3002/health
- **API Gateway 3**: http://localhost:3003/health
- **User Service**: http://localhost:3005/api/publics/hello
- **Redis**: localhost:6379
- **PostgreSQL**: localhost:5432

## Rate Limiting

### NGINX Layer (Per IP)
- **General endpoints**: 100 requests/minute
- **Auth endpoints**: 20 requests/minute

### Redis Layer (Shared across gateways)
- **General endpoints**: 100 requests per 15 minutes per IP
- **Auth endpoints**: 20 requests per 15 minutes per IP

## Testing Load Balancing

1. **Check which gateway handles requests:**
   ```bash
   curl -v http://localhost/health
   # Look for X-Gateway-ID header in response
   ```

2. **Test rate limiting:**
   ```bash
   # This will eventually hit rate limits
   for i in {1..25}; do curl http://localhost/api/auth/login; done
   ```

3. **Monitor logs:**
   ```bash
   docker-compose logs -f nginx-lb
   docker-compose logs -f api-gateway-1
   ```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GATEWAY_ID` | Unique identifier for each gateway | gateway-unknown |
| `REDIS_URL` | Redis connection string | redis://localhost:6379 |
| `API_SERVICE_URL` | Backend service URL | http://localhost:3005 |
| `DATABASE_URL` | PostgreSQL connection string | - |

### NGINX Configuration

The NGINX configuration (`nginx.conf`) includes:
- Round-robin load balancing
- Rate limiting per IP
- Health checks
- Proper headers forwarding
- Error handling

## Monitoring

### Health Checks

All services include health check endpoints:
- Services auto-restart if health checks fail
- NGINX monitors upstream health
- Docker health checks for containers

### Logging

- NGINX logs: `logs/nginx/`
- Application logs: `docker-compose logs [service]`
- Request tracing with gateway IDs

## Scaling

### Adding More Gateways

1. Add new service in `docker-compose.yml`
2. Update `nginx.conf` upstream block
3. Restart load balancer

### Horizontal Scaling

The architecture supports:
- Multiple gateway instances
- Database read replicas
- Redis clustering
- Service mesh integration

## Production Considerations

1. **Security:**
   - Use HTTPS with SSL certificates
   - Implement API authentication
   - Regular security updates

2. **Monitoring:**
   - Prometheus + Grafana
   - ELK stack for logging
   - APM tools

3. **Infrastructure:**
   - Kubernetes for orchestration
   - Cloud load balancers (ALB, etc.)
   - Managed Redis/Database services

## Troubleshooting

### Common Issues

1. **Services not starting:**
   ```bash
   docker-compose logs [service-name]
   ```

2. **Load balancer not distributing:**
   - Check NGINX configuration
   - Verify gateway health endpoints

3. **Rate limiting not working:**
   - Ensure Redis is running
   - Check Redis connections in gateway logs

### Debug Commands

```bash
# Check all service status
docker-compose ps

# View specific service logs
docker-compose logs -f api-gateway-1

# Test Redis connectivity
docker-compose exec redis redis-cli ping

# Check NGINX configuration
docker-compose exec nginx-lb nginx -t
```

## Development

### Local Development

For local development without Docker:

1. Start Redis: `redis-server`
2. Start User Service: `cd packages/user-service && npm run dev`
3. Start Gateway: `cd packages/api-gateway && npm run dev`

### Building

```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build api-gateway-1
```
