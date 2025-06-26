#!/bin/bash

# Fitness Tracker 2.0 - Deployment Script
# This script builds and deploys the load-balanced API gateway setup

set -e

echo "🚀 Starting Fitness Tracker 2.0 deployment..."

# Create logs directory for nginx
mkdir -p logs/nginx

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp .env.example .env
    echo "📝 Please edit .env file with your configuration before proceeding!"
    exit 1
fi

# Build and start services
echo "🔧 Building and starting services..."
docker-compose down --remove-orphans
docker-compose build --no-cache
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check service health
echo "🔍 Checking service health..."

# Check Redis
if docker-compose exec -T redis redis-cli ping | grep -q PONG; then
    echo "✅ Redis is healthy"
else
    echo "❌ Redis is not responding"
fi

# Check API Gateways
for i in {1..3}; do
    if curl -s -f http://localhost:300$i/health > /dev/null; then
        echo "✅ API Gateway $i is healthy"
    else
        echo "❌ API Gateway $i is not responding"
    fi
done

# Check NGINX Load Balancer
if curl -s -f http://localhost:8080/nginx-health > /dev/null; then
    echo "✅ NGINX Load Balancer is healthy"
else
    echo "❌ NGINX Load Balancer is not responding"
fi

# Check User Service
if curl -s -f http://localhost:3005/health > /dev/null; then
    echo "✅ User Service is healthy"
else
    echo "❌ User Service is not responding"
fi

# Check Workout Service
if curl -s -f http://localhost:3006/health > /dev/null; then
    echo "✅ Workout Service is healthy"
else
    echo "❌ Workout Service is not responding"
fi

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "📊 Service URLs:"
echo "  • Load Balancer:    http://api.localhost:8080"
echo "  • NGINX Health:     http://api.localhost:8080/nginx-health"
echo "  • API Gateway 1:    http://localhost:3001/health"
echo "  • API Gateway 2:    http://localhost:3002/health"
echo "  • API Gateway 3:    http://localhost:3003/health"
echo "  • User Service:     http://localhost:3005/health"
echo "  • Workout Service:  http://localhost:3006/health"
echo "  • Redis:            localhost:6379"
echo ""
echo "🔗 API Endpoints through Load Balancer:"
echo "  • POST http://api.localhost:8080/api/auth/signup"
echo "  • POST http://api.localhost:8080/api/auth/login"
echo "  • GET  http://api.localhost:8080/api/user/hello-world"
echo "  • POST http://api.localhost:8080/api/workout/*"
echo ""
echo "📈 To view logs:"
echo "  docker-compose logs -f [service-name]"
echo ""
echo "🛑 To stop all services:"
echo "  docker-compose down"
