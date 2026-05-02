import Joi from 'joi';

export const createCleaningTaskSchema = Joi.object({
  area: Joi.string().required().messages({
    'string.empty': 'Cleaning area is required'
  }),
  assignedTo: Joi.string().required().messages({
    'string.empty': 'Assigned Room ID is required'
  }),
  date: Joi.date().required().messages({
    'date.base': 'A valid date is required'
  })
});

export const updateTaskStatusSchema = Joi.object({
  status: Joi.string().valid('pending', 'in-progress', 'completed').required().messages({
    'any.only': 'Status must be pending, in-progress, or completed'
  })
});

export const createScheduleSchema = Joi.object({
  week: Joi.object({
    Monday: Joi.array().items(Joi.string()).required(),
    Tuesday: Joi.array().items(Joi.string()).required(),
    Wednesday: Joi.array().items(Joi.string()).required(),
    Thursday: Joi.array().items(Joi.string()).required(),
    Friday: Joi.array().items(Joi.string()).required(),
    Saturday: Joi.array().items(Joi.string()).required(),
    Sunday: Joi.array().items(Joi.string()).required(),
  }).required()
});
