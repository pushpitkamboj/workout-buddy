import express, { Request, Response } from "express";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { PrismaClient } from "@fitness-tracker2/shared";
import crypto from "crypto";
import { emailService } from '../utils/emailService';
import cookieParser from 'cookie-parser';

const prisma = new PrismaClient();

dotenv.config();
const router = express.Router();
router.use(express.json());
router.use(cookieParser()); // Middleware to parse cookies

// Signup route
router.post("/signup", async (req: Request, res: Response) => {
  const { email, password, username } = req.body;
  console.log(`Signing up user: ${email}`);
  try {
    console.log("before user creation");
    if (!email || !password || !username) {
      return res.status(400).json({ message: "Email, password, and username are required" });
    }
    const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true, isVerified: true } });
    console.log("after user creation");
    if (existingUser && !existingUser.isVerified) return res.status(400).json({ message: "Email has not been verified yet, click resend email to verify again" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiry = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        username,
        verificationToken: verificationToken,
        verificationTokenExpiry: verificationTokenExpiry
      },
    });
    console.log(`User created: ${user.verificationToken} and ${user.verificationTokenExpiry}`);
    // Send verification email using the email service
    const verifyEmailUrl = "http://localhost:3000/api/auth/verify-email";
    await emailService.sendVerificationEmail(email, verificationToken, verifyEmailUrl);

    res.json({ message: "Signup successful, please verify your email." });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: "Failed to create account" });
  }
});

export default router;