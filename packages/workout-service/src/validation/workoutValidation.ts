import Joi from 'joi';

export const createWorkoutSchema = Joi.object({
  date: Joi.date().iso().required(),
  exerciseType: Joi.string().valid('RUNNING', 'CYCLING', 'SWIMMING', 'WEIGHTLIFTING').required(),
  duration: Joi.number().integer().min(1).max(600).required(), // 1 minute to 10 hours
  calories: Joi.number().integer().min(1).max(5000).required()
});

export const updateWorkoutSchema = Joi.object({
  date: Joi.date().iso().optional(),
  exerciseType: Joi.string().valid('RUNNING', 'CYCLING', 'SWIMMING', 'WEIGHTLIFTING').optional(),
  duration: Joi.number().integer().min(1).max(600).optional(),
  calories: Joi.number().integer().min(1).max(5000).optional()
}).min(1); // At least one field must be provided

export const getWorkoutsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  exerciseType: Joi.string().valid('RUNNING', 'CYCLING', 'SWIMMING', 'WEIGHTLIFTING').optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional()
});
