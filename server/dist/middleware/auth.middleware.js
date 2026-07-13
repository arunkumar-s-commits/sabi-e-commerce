"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.requireAuth = void 0;
const firebase_1 = require("../config/firebase");
const response_1 = require("../utils/response");
const requireAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return (0, response_1.sendError)(res, 'Authorization token required. Please login.', 401);
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
        const decodedToken = await firebase_1.auth.verifyIdToken(token);
        const { uid, email, name } = decodedToken;
        // Fetch user role from Firestore
        let role = 'customer';
        try {
            const userDoc = await firebase_1.db.collection('users').doc(uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                if (userData && userData.role === 'admin') {
                    role = 'admin';
                }
            }
        }
        catch (dbErr) {
            console.warn(`Could not fetch user document for ${uid}, defaulting role to customer:`, dbErr);
        }
        req.user = {
            uid,
            email,
            name,
            role,
        };
        next();
    }
    catch (error) {
        console.error('Authentication Error:', error);
        return (0, response_1.sendError)(res, 'Invalid or expired authorization token.', 401);
    }
};
exports.requireAuth = requireAuth;
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return (0, response_1.sendError)(res, 'Authentication required.', 401);
    }
    if (req.user.role !== 'admin') {
        return (0, response_1.sendError)(res, 'Access denied. Administrator privileges required.', 403);
    }
    next();
};
exports.requireAdmin = requireAdmin;
