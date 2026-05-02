import Joi from 'joi';

export const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required().messages({
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 2 characters long'
  }),
  email: Joi.string().email().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Please provide a valid email address'
  }),
  password: Joi.string().min(6).required().messages({
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 6 characters long'
  }),
  role: Joi.string().valid('student', 'warden', 'admin').default('student'),
  campus: Joi.string().optional(),
  studentPhone: Joi.string().optional(),
  emergencyContactName: Joi.string().optional(),
  emergencyPhone: Joi.string().optional(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(50).optional(),
  email: Joi.string().email().optional(),
  password: Joi.string().min(6).optional(),
  role: Joi.string().valid('student', 'warden', 'admin').optional(),
  isActive: Joi.boolean().optional(),
  campus: Joi.string().optional(),
  studentPhone: Joi.string().optional(),
  emergencyContactName: Joi.string().optional(),
  emergencyPhone: Joi.string().optional(),
});
