import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import type { Filter, Options, RequestHandler } from 'http-proxy-middleware';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';
import helmet from 'helmet';

dotenv.config();

const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3005';
const workoutServiceUrl = process.env.WORKOUT_SERVICE_URL || 'http://localhost:3006';
const PORT = process.env.PORT || 3000;
const GATEWAY_ID = process.env.GATEWAY_ID || 'gateway-unknown';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Initialize Redis client
const redisClient = createClient({
  url: REDIS_URL
});

redisClient.on('error', (err: Error) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log(`[${GATEWAY_ID}] Connected to Redis`);
});

// Connect to Redis
redisClient.connect().catch(console.error);

const app = express();

// Trust proxy for proper IP detection behind load balancer
app.set('trust proxy', true);

// Shared rate limiter using Redis
const limiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    gateway: GATEWAY_ID
  }
});

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 auth requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many authentication attempts from this IP, please try again later.',
    gateway: GATEWAY_ID
  }
});

// Middleware for request logging with gateway ID
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${GATEWAY_ID}] ${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

app.use(limiter);
app.use(helmet());

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'OK', 
    gateway: GATEWAY_ID,
    timestamp: new Date().toISOString()
  });
});

// Apply auth rate limiting to authentication routes
app.use('/api/auth/*', authLimiter);

// Proxy for User Service (auth and user routes)
app.use(
  createProxyMiddleware({
    target: userServiceUrl,
    changeOrigin: true,
    pathFilter: ['api/user/**', 'api/auth/**'],
    on: {
      error: (err: Error, req: Request, res: any) => {
        console.error(`[${GATEWAY_ID}] User Service Proxy Error:`, err.message);
        if (res && res.status) {
          res.status(500).json({ 
            error: 'User service temporarily unavailable',
            gateway: GATEWAY_ID 
          });
        }
      },
      proxyReq: (proxyReq: any, req: Request) => {
        proxyReq.setHeader('X-Gateway-ID', GATEWAY_ID);
        console.log(`[${GATEWAY_ID}] Proxying ${req.method} ${req.originalUrl} to User Service at ${userServiceUrl}${req.originalUrl}`);
      }
    }
  })
);

// Proxy for Workout Service
app.use(
  createProxyMiddleware({
    target: workoutServiceUrl,
    changeOrigin: true,
    pathFilter: ['/api/workout/**'],
    on: {
      error: (err: Error, req: Request, res: any) => {
        console.error(`[${GATEWAY_ID}] Workout Service Proxy Error:`, err.message);
        if (res && res.status) {
          res.status(500).json({ 
            error: 'Workout service temporarily unavailable',
            gateway: GATEWAY_ID 
          });
        }
      },
      proxyReq: (proxyReq: any, req: Request) => {
        proxyReq.setHeader('X-Gateway-ID', GATEWAY_ID);
        console.log(`[${GATEWAY_ID}] Proxying ${req.method} ${req.originalUrl} to Workout Service at ${workoutServiceUrl}${req.originalUrl}`);
      }
    }
  })
);

// Catch-all route for undefined paths
app.all('*', (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The endpoint ${req.method} ${req.path} does not exist`,
    gateway: GATEWAY_ID,
    availableRoutes: [
      'GET /health',
      'GET /api/user/hello-world',
      'GET /api/publics/hello',
      'POST /api/auth/login',
      'POST /api/auth/signup',
      'GET /api/user/*',
      'POST /api/workout/*'
    ]
  });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
  console.log(`API Gateway ${GATEWAY_ID} is running on http://localhost:${PORT}`);
});
