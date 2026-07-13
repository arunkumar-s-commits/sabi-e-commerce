import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

export interface CustomError extends Error {
  statusCode?: number;
  details?: any;
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[Error] ${req.method} ${req.url}:`, {
    message,
    statusCode,
    details: err.details,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });

  return sendError(res, message, statusCode, err.details);
};

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const error: CustomError = new Error(`Route not found: ${req.method} ${req.url}`);
  error.statusCode = 404;
  next(error);
};
