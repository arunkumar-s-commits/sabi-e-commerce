import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  details?: any;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = 'Success',
  status = 200,
  pagination?: ApiResponse['pagination']
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
  };
  if (pagination) {
    response.pagination = pagination;
  }
  return res.status(status).json(response);
};

export const sendError = (
  res: Response,
  error: string,
  status = 500,
  details?: any
): Response => {
  return res.status(status).json({
    success: false,
    error,
    details,
  });
};
