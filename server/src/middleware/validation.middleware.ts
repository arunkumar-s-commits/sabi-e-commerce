import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { sendError } from '../utils/response';

export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map((err) => ({
      field: err.type === 'field' ? err.path : err.type,
      message: err.msg,
    }));
    return sendError(res, 'Validation error', 400, errorDetails);
  }
  next();
};
