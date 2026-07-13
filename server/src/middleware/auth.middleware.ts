import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { sendError } from '../utils/response';

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    name?: string;
    role: 'customer' | 'admin' | 'user';
  };
}

export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Authorization token required. Please login.', 401);
    }

    const token = authHeader.split('Bearer ')[1];

    // Development Mock Bypass
    if (token === 'mock-admin-token') {
      req.user = {
        uid: 'mock-admin-uid',
        email: 'admin@sabi.com',
        name: 'Mock Admin User',
        role: 'admin',
      };
      return next();
    }
    if (token === 'mock-customer-token') {
      req.user = {
        uid: 'mock-customer-uid',
        email: 'customer@sabi.com',
        name: 'Mock Customer User',
        role: 'customer',
      };
      return next();
    }

    // Verify live token with Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error('Supabase Auth Error:', error);
      return sendError(res, 'Invalid or expired authorization token.', 401);
    }

    // Fetch user role from profiles table (assuming role is stored there)
    let role: 'customer' | 'admin' | 'user' = 'user';
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
        
      if (profile && profile.role === 'admin') {
        role = 'admin';
      }
    } catch (dbErr) {
      console.warn(`Could not fetch user document for ${user.id}, defaulting role to user:`, dbErr);
    }

    req.user = {
      uid: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || '',
      role,
    };

    next();
  } catch (error: any) {
    console.error('Authentication Error:', error);
    return sendError(res, 'Authentication failed.', 401);
  }
};

export const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return sendError(res, 'Authentication required.', 401);
  }

  if (req.user.role !== 'admin') {
    return sendError(res, 'Access denied. Administrator privileges required.', 403);
  }

  next();
};
