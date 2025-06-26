# Fitness Tracker 2.0 - PowerShell Deployment Script
# This script builds and deploys the fully dockerized fitness tracker system

Write-Host "🚀 Starting Fitness Tracker 2.0 deployment..." -ForegroundColor Green

# Create logs directory for nginx
if (!(Test-Path "logs\nginx")) {
    New-Item -ItemType Directory -Path "logs\nginx" -Force
    Write-Host "📁 Created nginx logs directory" -ForegroundColor Yellow
}

# Build and start services
Write-Host "🔧 Building and starting services..." -ForegroundColor Cyan
docker-compose down --remove-orphans
docker-compose build --no-cache
docker-compose up -d

# Wait for services to be ready
Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep 30

# Check service health
Write-Host "🔍 Checking service health..." -ForegroundColor Cyan

# Check Redis
try {
    $redisResult = docker-compose exec -T redis redis-cli ping
    if ($redisResult -like "*PONG*") {
        Write-Host "✅ Redis is healthy" -ForegroundColor Green
    } else {
        Write-Host "❌ Redis is not responding" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Redis check failed" -ForegroundColor Red
}

# Check API Gateways
for ($i = 1; $i -le 3; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:300$i/health" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ API Gateway $i is healthy" -ForegroundColor Green
        }
    } catch {
        Write-Host "❌ API Gateway $i is not responding" -ForegroundColor Red
    }
}

# Check NGINX Load Balancer
try {
    $response = Invoke-WebRequest -Uri "http://api.localhost:8080/nginx-health" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ NGINX Load Balancer is healthy" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ NGINX Load Balancer is not responding" -ForegroundColor Red
}

# Check User Service
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3005/health" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ User Service is healthy" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ User Service is not responding" -ForegroundColor Red
}

# Check Workout Service
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3006/health" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Workout Service is healthy" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Workout Service is not responding" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 Deployment completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Service URLs:" -ForegroundColor Cyan
Write-Host "  • Load Balancer:    http://api.localhost:8080" -ForegroundColor White
Write-Host "  • NGINX Health:     http://api.localhost:8080/nginx-health" -ForegroundColor White
Write-Host "  • API Gateway 1:    http://localhost:3001/health" -ForegroundColor White
Write-Host "  • API Gateway 2:    http://localhost:3002/health" -ForegroundColor White
Write-Host "  • API Gateway 3:    http://localhost:3003/health" -ForegroundColor White
Write-Host "  • User Service:     http://localhost:3005/health" -ForegroundColor White
Write-Host "  • Workout Service:  http://localhost:3006/health" -ForegroundColor White
Write-Host "  • Redis:            localhost:6379" -ForegroundColor White
Write-Host ""
Write-Host "🔗 API Endpoints through Load Balancer:" -ForegroundColor Cyan
Write-Host "  • POST http://api.localhost:8080/api/auth/signup" -ForegroundColor White
Write-Host "  • POST http://api.localhost:8080/api/auth/login" -ForegroundColor White
Write-Host "  • GET  http://api.localhost:8080/api/user/hello-world" -ForegroundColor White
Write-Host "  • POST http://api.localhost:8080/api/workout/*" -ForegroundColor White
Write-Host ""
Write-Host "📈 To view logs:" -ForegroundColor Yellow
Write-Host "  docker-compose logs -f [service-name]" -ForegroundColor White
Write-Host ""
Write-Host "🛑 To stop all services:" -ForegroundColor Yellow
Write-Host "  docker-compose down" -ForegroundColor White
