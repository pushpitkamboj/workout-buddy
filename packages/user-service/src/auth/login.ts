import express, { Request, Response } from "express";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@fitness-tracker2/shared";
import cookieParser from 'cookie-parser';
import { authMiddleware } from "../middleware/auth";

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

dotenv.config();
const app = express();
app.use(express.json());
app.use(cookieParser()); // Middleware to parse cookies

// Login route
app.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(400).json({ message: "Invalid credentials" });
  if (!user.isVerified) return res.status(403).json({ message: "Email not verified" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ message: "password is incorrect" });

  const accessToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "15m" });
  const refreshToken = jwt.sign({ userId: user.id }, JWT_REFRESH_SECRET, { expiresIn: "7d" });

  // Optionally save refreshToken in DB
  await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

    res.cookie('accessToken', accessToken, {
    httpOnly: false, // Not HTTP-only so client JS can access it
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000 // 15 minutes
  });

  // Only set refresh token as HTTP-only cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    // path: '/refresh' // Uncomment to restrict cookie to /refresh endpoint only
  });

  // Send access token in response body (not as cookie)
  res.json({ message: "Login successful", accessToken });
});

app.get('/login', authMiddleware, (req: Request, res: Response) => {
  res.send('<h1>Login Page</h1><p>Please login to continue.</p>');
});

export default app;