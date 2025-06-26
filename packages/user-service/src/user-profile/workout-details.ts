import { Request, Response, Router } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@fitness-tracker2/shared';
import { emailService } from '../utils/emailService';
import crypto from 'crypto';
import { 
  ProfileUpdateRequest
} from '../utils/types';
import { authMiddleware } from '../middleware/auth';

// import { getUserId } from '../utils/get-userId';
const BASE_URL = process.env.BASE_URL!;
const router = Router();
const prisma = new PrismaClient();

// GET /profile/workouts - Get user's workout history
router.get('/profile/workouts', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
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
router.get('/profile/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
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


export default router;
