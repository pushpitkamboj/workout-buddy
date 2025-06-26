import { Request, Response, Router } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@fitness-tracker2/shared';
import { emailService } from './utils/emailService';
import crypto from 'crypto';
import { 
  ProfileUpdateRequest,
} from './utils/types';
import { authMiddleware } from './middleware/auth';

const BASE_URL = process.env.BASE_URL!;
const router = Router();
const prisma = new PrismaClient();

// Middleware to extract user ID from headers (set by API Gateway)
const getUserId = (req: Request): string | null => {
  return req.headers['x-user-id'] as string || (req as any).user?.userId || null;
};

// GET /profile - Get user profile details
router.get('/profile', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
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
router.put('/profile', authMiddleware, async (req: Request<{}, {}, ProfileUpdateRequest>, res: Response) => {
  try {
    const userId = getUserId(req);
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
        console.log(`the logic is here: ${email}`);
        return;
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

// PUT /profile/password - Change password
// router.put('/profile/password', async (req: Request, res: Response) => {
//   try {
//     const userId = getUserId(req);
//     if (!userId) {
//       return res.status(401).json({ message: 'User ID not found' });
//     }

//     const { currentPassword, newPassword } = req.body;

//     if (!currentPassword || !newPassword) {
//       return res.status(400).json({ message: 'Current password and new password are required' });
//     }

//     if (newPassword.length < 6) {
//       return res.status(400).json({ message: 'New password must be at least 6 characters long' });
//     }
//     if (currentPassword === newPassword) {
//       return res.status(400).json({ message: 'New password must be different from current password' });
//     }

//     // Get current user
//     const user = await prisma.user.findUnique({
//       where: { id: userId },
//       select: { id: true, password: true }
//     });

//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     // Verify current password
//     const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
//     if (!isCurrentPasswordValid) {
//       return res.status(400).json({ message: 'The password you entered does not match with your current password' });
//     }

//     // Hash new password
//     const hashedNewPassword = await bcrypt.hash(newPassword, 10);

//     // Update password
//     await prisma.user.update({
//       where: { id: userId },
//       data: { password: hashedNewPassword }
//     });

//     res.json({ message: 'Password changed successfully' });
//   } catch (error) {
//     console.error('Change password error:', error);
//     res.status(500).json({ message: 'Failed to change password' });
//   }
// });

// DELETE /profile - Delete user account
router.delete('/profile', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
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

// GET /profile/workouts - Get user's workout history
router.get('/profile/workouts', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: 'User ID not found' });
    }

    const { page = '1', limit = '10', exerciseType } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { userId };
    if (exerciseType) {
      where.exerciseType = exerciseType;
    }

    const workouts = await prisma.workout.findMany({
      where,
      orderBy: { date: 'desc' },
      skip,
      take: limitNum,      select: {
        id: true,
        date: true,
        exerciseType: true,
        duration: true,
        calories: true
      } as any
    });

    const totalWorkouts = await prisma.workout.count({ where });

    res.json({
      workouts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalWorkouts,
        totalPages: Math.ceil(totalWorkouts / limitNum)
      }
    });
  } catch (error) {
    console.error('Get workouts error:', error);
    res.status(500).json({ message: 'Failed to fetch workouts' });
  }
});

// GET /profile/stats - Get user's workout statistics
router.get('/profile/stats', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: 'User ID not found' });
    }

    const { period = 'all' } = req.query;
    
    // Calculate date range based on period
    let dateFilter: any = {};
    const now = new Date();
    
    switch (period) {
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = { gte: weekAgo };
        break;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateFilter = { gte: monthAgo };
        break;
      case 'year':
        const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        dateFilter = { gte: yearAgo };
        break;
      default:
        // 'all' - no date filter
        break;
    }

    const where: any = { userId };
    if (Object.keys(dateFilter).length > 0) {
      where.date = dateFilter;
    }    // Get total stats
    const totalStats = await prisma.workout.aggregate({
      where,
      _sum: {
        duration: true,
        calories: true
      } as any,
      _count: true
    });    // Get stats by exercise type
    const statsByType = await prisma.workout.groupBy({
      by: ['exerciseType'] as any,
      where,
      _sum: {
        duration: true,
        calories: true
      } as any,
      _count: true
    });    // Get recent activity (last 7 days)
    const recentActivity = await prisma.workout.findMany({
      where: {
        userId,
        date: {
          gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      orderBy: { date: 'desc' },
      select: {
        date: true,
        exerciseType: true,
        duration: true,
        calories: true
      } as any
    });res.json({
      period,
      totalStats: {
        workouts: totalStats._count,
        duration: totalStats._sum?.duration || 0,
        calories: (totalStats._sum as any)?.calories || 0
      },
      statsByType,
      recentActivity
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Failed to fetch statistics' });
  }
});

// GET /profile/notifications - Get user's notifications
router.get('/profile/notifications', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: 'User ID not found' });
    }

    const { page = '1', limit = '10', status } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,      select: {
        id: true,
        type: true,
        content: true,
        status: true,
        createdAt: true
      } as any
    });

    const totalNotifications = await prisma.notification.count({ where });

    res.json({
      notifications,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalNotifications,
        totalPages: Math.ceil(totalNotifications / limitNum)
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

export default router;
