// src/middleware/auth.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@fitness-tracker2/shared";
import dotenv from "dotenv";
dotenv.config();

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  // Check for access token in cookies or Authorization header
  let accessToken = req.cookies.accessToken || 
                   (req.headers.authorization?.startsWith('Bearer ') 
                    ? req.headers.authorization.split(' ')[1] 
                    : null);

  // 1. Valid access token case
  if (accessToken) {
    try {
      const decoded = jwt.verify(accessToken, JWT_SECRET) as { userId: string };
      req.userId = decoded.userId;
      return next();
    } catch (error) {
      console.error("Access token verification failed:", error);
      // If not expired, fail immediately
      if (error instanceof jwt.JsonWebTokenError && error.name !== 'TokenExpiredError') {
        return res.status(401).json({ message: "Invalid access token" });
      }
      // Continue to refresh token flow if expired
    }
  }

  // 2. Access token missing or expired - try refresh token
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { userId: string };
    
    // Check against database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, refreshToken: true }
    });

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    // Generate new access token
    const newAccessToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "15m" });

    // Set new access token in cookie and response
    res.cookie('accessToken', newAccessToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000
    });

    // Attach user ID to request
    req.userId = user.id;

    // Continue to protected route
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: "Refresh token expired" });
    }
    return res.status(401).json({ message: "Invalid refresh token" });
  }
};
