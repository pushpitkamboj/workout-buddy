import express, { Request, Response } from "express";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@fitness-tracker2/shared";

import cookieParser from 'cookie-parser';

const prisma = new PrismaClient();
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;


const router = express.Router();
router.use(express.json());
router.use(cookieParser()); // Middleware to parse cookies

// Refresh token endpoint
router.post("/refresh", async (req: Request, res: Response) => {
  // Read refresh token from HTTP-only cookie
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) {
    return res.status(400).json({ message: "Refresh token required" });
  }
  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { userId: string };
    // Find user and check if refreshToken matches
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }
    // Generate new access token
    const accessToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "15m" });
    // Do NOT set access token as HTTP-only cookie, return in response body
    return res.json({ message: "Access token refreshed", accessToken });
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired refresh token" });
  }
});

export default router;