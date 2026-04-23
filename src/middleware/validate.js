const { z } = require('zod');

const transactionSchema = z.object({
  type:        z.enum(['income', 'expense']),
  amount:      z.number().positive('Amount must be positive'),
  category:    z.string().min(1).max(100),
  description: z.string().max(500).optional().default(''),
  date:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
});

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error:   'Validation failed',
      details: result.error.issues.map((i) => ({
        field:   i.path.join('.'),
        message: i.message,
      })),
    });
  }
  req.body = result.data;
  next();
};

module.exports = { validate, transactionSchema };
