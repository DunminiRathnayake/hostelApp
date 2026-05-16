import Joi from 'joi';

export const createPaymentSchema = Joi.object({
  amount: Joi.number().positive().required().messages({
    'number.base': 'Amount must be a number',
    'number.positive': 'Amount must be greater than zero',
    'any.required': 'A valid amount is required'
  }),
  category: Joi.string().required().messages({
    'string.empty': 'Category is required'
  }),
  description: Joi.string().optional().allow(''),
  paymentType: Joi.string().valid('cash', 'card', 'bank_transfer', 'online').default('cash'),
  month: Joi.string().optional().allow('')
});

export const updatePaymentStatusSchema = Joi.object({
  status: Joi.string().valid('pending', 'approved', 'rejected').optional(),
  amount: Joi.number().positive().optional()
});
