import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cookieParser from 'cookie-parser';
import { loginRoutes, signupRoutes, refreshTokenRoutes, passwordResetRoutes, verifyEmailRoutes, resendEmailVerifyRoutes } from './auth';
import { profileRouter, workoutDetailsRouter, notificationsRouter } from './user-profile';

dotenv.config();
const app = express();
app.use(express.json());
app.use(cookieParser()); // Middleware to parse cookies

app.use((req: Request, res: Response, next) => {
  console.log(`[USER-SERVICE] ${new Date().toISOString()} - ${req.method} ${req.url} - Headers: ${JSON.stringify(req.headers)}`);
  next();
});

// Mount auth-related routes
app.use('/api/auth', loginRoutes);
app.use('/api/auth', signupRoutes);
app.use('/api/auth', refreshTokenRoutes);
app.use('/api/auth', passwordResetRoutes);
app.use('/api/auth', verifyEmailRoutes);
// app.use('/api/auth', resendEmailVerifyRoutes);

app.use('/api/user', profileRouter);
app.use('/api/user', workoutDetailsRouter);
app.use('/api/user', notificationsRouter);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'OK',
    service: 'user-service',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/publics/hello', (req: Request, res: Response) => {
  res.send({ message: 'Public API endpoint' });
});

app.get('/api/user/hello-world', (req: Request, res: Response) => {
  res.send('<h1>Welcome to the User Service</h1><p>Use the API endpoints for authentication and user management.</p>');
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`User service running on port ${PORT}`);
});
