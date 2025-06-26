import { Request, Response, Router } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@fitness-tracker2/shared';
import { emailService } from '../utils/emailService';
import crypto from 'crypto';
import { 
  ProfileUpdateRequest
} from '../utils/types';

const BASE_URL = process.env.BASE_URL!;
const router = Router();
const prisma = new PrismaClient();


// GET /profile - Get user profile details
router.get('/profile', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    if (!userId) {
      return res.status(401).json({ message: 'User ID not found' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        username: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,        // Include workout statistics
        workouts: {
          select: {
            date: true,
            exerciseType: true,
            duration: true,
            calories: true
          } as any,
          orderBy: { date: 'desc' }
        },
        _count: {
          select: {
            workouts: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        ...user
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

// PUT /profile - Update user profile
router.put('/profile', async (req: Request<{}, {}, ProfileUpdateRequest>, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    if (!userId) {
      return res.status(401).json({ message: 'User ID not found' });
    }

    const { username, email } = req.body;

    // Validate input
    if (!username && !email) {
      return res.status(400).json({ message: 'At least one field (username or email) is required' });
    }

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id: userId }
        }
      });

      if (existingUser) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    const updateData: any = {};
    if (username) updateData.username = username;    if (email) {
      updateData.email = email;
      // If email is changed, mark as unverified
      updateData.isVerified = false;
      
      const verificationToken = crypto.randomBytes(32).toString("hex");
      await emailService.sendVerificationEmail(email, verificationToken, BASE_URL);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        isVerified: true,
        updatedAt: true
      }
    });

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});


// DELETE /profile - Delete user account
router.delete('/profile', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    if (!userId) {
      return res.status(401).json({ message: 'User ID not found' });
    }

    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Password is required to delete account' });
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true, email: true }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Password is incorrect' });
    }

    // Delete user (CASCADE will handle related records)
    await prisma.user.delete({
      where: { id: userId }
    });

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Failed to delete account' });
  }
});

export default router;