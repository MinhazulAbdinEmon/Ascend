import { validationResult } from 'express-validator';

// Runs after the express-validator chains defined in the routes.
// If any rule failed, respond 400 with the first human-readable message.
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: errors.array()[0].msg,
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};
