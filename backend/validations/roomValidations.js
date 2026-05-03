import Joi from 'joi';

export const createRoomSchema = Joi.object({
  roomNumber: Joi.string().required().messages({
    'string.empty': 'Room number is required'
  }),
  capacity: Joi.number().integer().min(1).required().messages({
    'number.base': 'Capacity must be a number',
    'number.min': 'Capacity must be at least 1'
  }),
  type: Joi.string().valid('Standard', 'Single', 'Double', 'Triple', 'Dormitory').default('Standard'),
  status: Joi.string().valid('Available', 'Full', 'Maintenance').default('Available'),
  price: Joi.number().min(0).optional(),
});

export const updateRoomSchema = Joi.object({
  roomNumber: Joi.string().optional(),
  capacity: Joi.number().integer().min(1).optional(),
  type: Joi.string().valid('Standard', 'Single', 'Double', 'Triple', 'Dormitory').optional(),
  status: Joi.string().valid('Available', 'Full', 'Maintenance').optional(),
  price: Joi.number().min(0).optional(),
});

export const assignStudentSchema = Joi.object({
  studentId: Joi.string().required().messages({
    'string.empty': 'Student ID is required'
  }),
  roomId: Joi.string().required().messages({
    'string.empty': 'Room ID is required'
  })
});
