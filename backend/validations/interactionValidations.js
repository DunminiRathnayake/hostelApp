import Joi from 'joi';

export const submitReviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required().messages({
    'number.base': 'Rating must be a number',
    'number.min': 'Rating must be between 1 and 5',
    'number.max': 'Rating must be between 1 and 5',
    'any.required': 'Rating is required'
  }),
  comment: Joi.string().trim().min(3).required().messages({
    'string.empty': 'Comment is required',
    'string.min': 'Comment must be at least 3 characters long'
  })
});

export const createComplaintSchema = Joi.object({
  title: Joi.string().trim().min(3).max(100).required().messages({
    'string.empty': 'Title is required',
    'string.min': 'Title must be at least 3 characters long',
    'string.max': 'Title must not exceed 100 characters'
  }),
  description: Joi.string().trim().min(10).required().messages({
    'string.empty': 'Description is required',
    'string.min': 'Description must be at least 10 characters long to provide enough detail'
  })
});

export const updateComplaintStatusSchema = Joi.object({
  status: Joi.string().valid('Pending', 'In Progress', 'Resolved').required().messages({
    'any.only': 'Status must be Pending, In Progress, or Resolved',
    'any.required': 'Status is required'
  })
});
