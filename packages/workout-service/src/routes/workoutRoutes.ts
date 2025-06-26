import express from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getWorkouts,
  getWorkoutById,
  createWorkout,
  updateWorkout,
  deleteWorkout,
  getWorkoutStats
} from '../controllers/workoutController';

const router = express.Router();

// All workout routes require authentication
router.use(authMiddleware);

// Workout CRUD routes
router.get('/workouts', getWorkouts);
router.get('/workouts/stats', getWorkoutStats);
router.get('/workouts/:id', getWorkoutById);
router.post('/workouts', createWorkout);
router.put('/workouts/:id', updateWorkout);
router.delete('/workouts/:id', deleteWorkout);

export { router as workoutRouter };
