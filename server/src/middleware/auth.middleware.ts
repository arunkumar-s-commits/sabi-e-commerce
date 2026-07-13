import { Request, Response, NextFunction } from 'express';
import { auth, db } from '../config/firebase';
import { sendError } from '../utils/response';

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    name?: string;
    role: 'customer' | 'admin';
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

    // Verify live token
    const decodedToken = await auth.verifyIdToken(token);
    const { uid, email, name } = decodedToken;

    // Fetch user role from Firestore
    let role: 'customer' | 'admin' = 'customer';
    try {
      const userDoc = await db.collection('users').doc(uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        if (userData && userData.role === 'admin') {
          role = 'admin';
        }
      }
    } catch (dbErr) {
      console.warn(`Could not fetch user document for ${uid}, defaulting role to customer:`, dbErr);
    }

    req.user = {
      uid,
      email,
      name,
      role,
    };

    next();
  } catch (error: any) {
    console.error('Authentication Error:', error);
    return sendError(res, 'Invalid or expired authorization token.', 401);
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
