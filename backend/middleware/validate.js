import Joi from 'joi';

/**
 * Validates request data against a Joi schema.
 * @param {Joi.ObjectSchema} schema - The Joi schema to validate against
 * @param {string} source - Where to find data ('body', 'query', 'params')
 */
export const validate = (schema, source = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[source], {
    abortEarly: false, // Return all errors
    stripUnknown: true // Remove unknown keys
  });

  if (error) {
    const errorMessages = error.details.map(detail => detail.message);
    return res.status(400).json({
      message: 'Validation Error',
      errors: errorMessages
    });
  }

  // Overwrite request data with validated/sanitized data
  req[source] = value;
  next();
};
