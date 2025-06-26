import { Request, Response, Router } from 'express';
import { PrismaClient } from '@fitness-tracker2/shared';
// import { getUserId } from '../utils/get-userId';

const router = Router();
const prisma = new PrismaClient();

// GET /profile/notifications - Get user's notifications
router.get('/profile/notifications', async (req: Request, res: Response) => {
  try {
    // const userId = getUserId(req);
    const userId = (req as any).user.userId; // Assuming userId is set in the request object by auth middleware
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