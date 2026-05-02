import Joi from 'joi';

export const scanQRSchema = Joi.object({
  token: Joi.string().required().messages({
    'string.empty': 'QR token is required'
  }),
  scannerDeviceId: Joi.string().optional()
});
