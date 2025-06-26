import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@fitness-tracker2/shared';
import { createWorkoutSchema, updateWorkoutSchema, getWorkoutsQuerySchema } from '../validation/workoutValidation';

const prisma = new PrismaClient();

// Get all workouts for a user with pagination and filtering
export const getWorkouts = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    
    // Validate query parameters
    const { error, value } = getWorkoutsQuerySchema.validate(req.query);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { page, limit, exerciseType, startDate, endDate } = value;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { userId };
    
    if (exerciseType) {
      where.exerciseType = exerciseType;
    }
    
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    // Get workouts with pagination
    const [workouts, total] = await Promise.all([
      prisma.workout.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        select: {
          id: true,
          date: true,
          exerciseType: true,
          duration: true,
          calories: true
        } as any
      }),
      prisma.workout.count({ where })
    ]);

    res.json({
      workouts,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: workouts.length,
        totalRecords: total
      }
    });
  } catch (error) {
    console.error('Error fetching workouts:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get a specific workout by ID
export const getWorkoutById = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const workout = await prisma.workout.findFirst({
      where: { 
        id,
        userId 
      },
      select: {
        id: true,
        date: true,
        exerciseType: true,
        duration: true,
        calories: true
      } as any
    });

    if (!workout) {
      return res.status(404).json({ message: 'Workout not found' });
    }

    res.json(workout);
  } catch (error) {
    console.error('Error fetching workout:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Create a new workout
export const createWorkout = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    
    // Validate request body
    const { error, value } = createWorkoutSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { date, exerciseType, duration, calories } = value;

    const workout = await prisma.workout.create({
      data: {
        userId,
        date: new Date(date),
        duration,
        calories
      } as any,
      select: {
        id: true,
        date: true,
        exerciseType: true,
        duration: true,
        calories: true
      } as any
    });

    res.status(201).json({
      message: 'Workout created successfully',
      workout
    });
  } catch (error) {
    console.error('Error creating workout:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update a workout
export const updateWorkout = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    
    // Validate request body
    const { error, value } = updateWorkoutSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // Check if workout exists and belongs to user
    const existingWorkout = await prisma.workout.findFirst({
      where: { id, userId }
    });

    if (!existingWorkout) {
      return res.status(404).json({ message: 'Workout not found' });
    }

    // Update workout
    const updatedWorkout = await prisma.workout.update({
      where: { id },
      data: {
        ...value,
        date: value.date ? new Date(value.date) : undefined
      },
      select: {
        id: true,
        date: true,
        exerciseType: true,
        duration: true,
        calories: true
      } as any
    });

    res.json({
      message: 'Workout updated successfully',
      workout: updatedWorkout
    });
  } catch (error) {
    console.error('Error updating workout:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete a workout
export const deleteWorkout = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    // Check if workout exists and belongs to user
    const existingWorkout = await prisma.workout.findFirst({
      where: { id, userId }
    });

    if (!existingWorkout) {
      return res.status(404).json({ message: 'Workout not found' });
    }

    await prisma.workout.delete({
      where: { id }
    });

    res.json({ message: 'Workout deleted successfully' });
  } catch (error) {
    console.error('Error deleting workout:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get workout statistics for a user
export const getWorkoutStats = async (req: Request, res: Response) => {
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
};
