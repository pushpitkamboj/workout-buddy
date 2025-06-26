import express, { Request, Response } from "express";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@fitness-tracker2/shared";
import crypto from "crypto";
import { emailService } from '../../utils/emailService';
import cookieParser from 'cookie-parser';
import { authMiddleware } from '../../middleware/auth';

const prisma = new PrismaClient();

dotenv.config();
const router = express.Router();
router.use(express.json());
router.use(cookieParser()); // Middleware to parse cookies


// Password reset request route
router.post('/request-password-reset', authMiddleware, async (req: Request, res: Response) => {
  const userId = req.userId;
  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, isVerified: true } });
    if (!user) {
      // For security, do not reveal if user exists
      return res.json({ message: 'If that email exists, a reset link has been sent.' });
    }
    if (!user.isVerified) {
      return res.status(400).json({ message: 'Email has not been verified yet, please verify your email first.' });
    }
    const passwordResetToken = crypto.randomBytes(32).toString('hex');
    const passwordResetTokenExpiry = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
    await prisma.user.update({
      where: { id: userId },
      data: { passwordResetToken, passwordResetTokenExpiry },
    });
    // Send password reset email
    const resetLink = `http://localhost:3000/api/auth/reset-password?token=${passwordResetToken}&email=${user.email}`;
    await emailService.sendEmail({
      to: user.email,
      subject: 'Reset Your Password - Fitness Tracker',
      html: `<p>Click <a href="${resetLink}">here</a> to reset your password. This link will expire in 1 hour.</p><p>If you did not request this, please ignore this email.</p>`
    });
    res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ message: 'Failed to process password reset request' });
  }
});


router.post('/reset-password', authMiddleware, async (req, res) => {
  const newPassword = req.body.newPassword;
  const id = req.userId;
  const user = await prisma.user.findUnique({ where: { id: id }});
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const encryptedPassword = bcrypt.hashSync(newPassword, 10);
  await prisma.user.update({
    where: { id: id },
    data: { password: encryptedPassword, passwordResetToken: null, passwordResetTokenExpiry: null }
  });

  res.send('the new password has been set successfully');
});


// Password reset route
router.post('/reset-password', authMiddleware, async (req: Request, res: Response) => {
  const { email, token, newPassword } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.passwordResetToken !== token || !user.passwordResetTokenExpiry || user.passwordResetTokenExpiry < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired password reset link.' });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetTokenExpiry: null
      }
    });
    res.json({ message: 'Password has been reset successfully.' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Failed to reset password' });
  }
});

export default router;