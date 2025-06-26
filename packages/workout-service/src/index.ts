import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { workoutRouter } from './routes/workoutRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3006;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  credentials: true,
  origin: process.env.FRONTEND_URL || 'http://localhost:3000'
}));

// Request logging middleware
app.use((req: Request, res: Response, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'OK',
    service: 'workout-service',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/workout', workoutRouter);

// Test endpoint
app.get('/api/workout/hello-world', (req: Request, res: Response) => {
  res.send('<h1>Welcome to the Workout Service</h1><p>Use the API endpoints for workout management.</p>');
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error('Error:', err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Workout service running on port ${PORT}`);
});

export default app;
