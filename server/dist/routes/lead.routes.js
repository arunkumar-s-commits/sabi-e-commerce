"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const firebase_1 = require("../config/firebase");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const response_1 = require("../utils/response");
const router = (0, express_1.Router)();
// @route   POST /api/leads/wedding
// @desc    Submit a wedding return gift inquiry
// @access  Public
router.post('/wedding', [
    (0, express_validator_1.body)('name').notEmpty().withMessage('Contact name is required'),
    (0, express_validator_1.body)('phone').notEmpty().withMessage('Phone number is required'),
    (0, express_validator_1.body)('eventDate').notEmpty().withMessage('Event date is required'),
    (0, express_validator_1.body)('quantity').isInt({ min: 10 }).withMessage('Minimum order quantity is 10 pieces'),
    (0, express_validator_1.body)('budget').isNumeric().withMessage('Estimated budget is required'),
    (0, express_validator_1.body)('productPreference').optional().isString(),
], validation_middleware_1.validateRequest, async (req, res) => {
    try {
        const { name, phone, email, eventDate, quantity, budget, productPreference } = req.body;
        const leadRef = firebase_1.db.collection('weddingLeads').doc();
        const newLead = {
            id: leadRef.id,
            name,
            phone,
            email: email || '',
            eventDate,
            quantity: Number(quantity),
            budget: Number(budget),
            productPreference: productPreference || '',
            status: 'new',
            notes: '',
            createdAt: new Date().toISOString(),
        };
        await leadRef.set(newLead);
        return (0, response_1.sendSuccess)(res, newLead, 'Wedding inquiry submitted successfully! Our expert will call you within 24 hours.', 201);
    }
    catch (error) {
        console.error('Error submitting wedding lead:', error);
        return (0, response_1.sendError)(res, 'Failed to submit wedding inquiry', 500);
    }
});
// @route   POST /api/leads/corporate
// @desc    Submit a corporate gifting inquiry
// @access  Public
router.post('/corporate', [
    (0, express_validator_1.body)('companyName').notEmpty().withMessage('Company name is required'),
    (0, express_validator_1.body)('contactPerson').notEmpty().withMessage('Contact person name is required'),
    (0, express_validator_1.body)('phone').notEmpty().withMessage('Phone number is required'),
    (0, express_validator_1.body)('quantity').isInt({ min: 5 }).withMessage('Minimum order quantity is 5 sets'),
    (0, express_validator_1.body)('budget').isNumeric().withMessage('Estimated budget is required'),
    (0, express_validator_1.body)('requirements').notEmpty().withMessage('Gifting requirements are required'),
], validation_middleware_1.validateRequest, async (req, res) => {
    try {
        const { companyName, contactPerson, phone, email, gstNumber, quantity, budget, requirements } = req.body;
        const leadRef = firebase_1.db.collection('corporateLeads').doc();
        const newLead = {
            id: leadRef.id,
            companyName,
            contactPerson,
            phone,
            email: email || '',
            gstNumber: gstNumber || '',
            quantity: Number(quantity),
            budget: Number(budget),
            requirements,
            status: 'new',
            notes: '',
            createdAt: new Date().toISOString(),
        };
        await leadRef.set(newLead);
        return (0, response_1.sendSuccess)(res, newLead, 'Corporate inquiry submitted successfully! Our manager will email a customized catalog.', 201);
    }
    catch (error) {
        console.error('Error submitting corporate lead:', error);
        return (0, response_1.sendError)(res, 'Failed to submit corporate inquiry', 500);
    }
});
// @route   GET /api/leads/admin/all
// @desc    Get all leads from both categories (Admin only)
// @access  Private/Admin
router.get('/admin/all', auth_middleware_1.requireAuth, auth_middleware_1.requireAdmin, async (req, res) => {
    try {
        const weddingSnapshot = await firebase_1.db.collection('weddingLeads').orderBy('createdAt', 'desc').get();
        const corporateSnapshot = await firebase_1.db.collection('corporateLeads').orderBy('createdAt', 'desc').get();
        const weddingLeads = [];
        const corporateLeads = [];
        weddingSnapshot.forEach((doc) => {
            weddingLeads.push({ ...doc.data(), type: 'wedding' });
        });
        corporateSnapshot.forEach((doc) => {
            corporateLeads.push({ ...doc.data(), type: 'corporate' });
        });
        // Combine and sort by date
        const allLeads = [...weddingLeads, ...corporateLeads].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return (0, response_1.sendSuccess)(res, allLeads, 'All leads fetched successfully');
    }
    catch (error) {
        console.error('Error fetching leads for admin:', error);
        return (0, response_1.sendError)(res, 'Failed to fetch leads', 500);
    }
});
// @route   PUT /api/leads/admin/:type/:id
// @desc    Update lead status / notes (Admin only)
// @access  Private/Admin
router.put('/admin/:type/:id', auth_middleware_1.requireAuth, auth_middleware_1.requireAdmin, [
    (0, express_validator_1.body)('status').isIn(['new', 'contacted', 'quoted', 'converted', 'lost']).withMessage('Invalid status'),
    (0, express_validator_1.body)('notes').optional().isString(),
], validation_middleware_1.validateRequest, async (req, res) => {
    try {
        const { type, id } = req.params;
        const collectionName = type === 'wedding' ? 'weddingLeads' : 'corporateLeads';
        const leadRef = firebase_1.db.collection(collectionName).doc(id);
        const doc = await leadRef.get();
        if (!doc.exists) {
            return (0, response_1.sendError)(res, 'Lead not found', 404);
        }
        const { status, notes } = req.body;
        const updateData = { status };
        if (notes !== undefined) {
            updateData.notes = notes;
        }
        await leadRef.update(updateData);
        const updatedDoc = await leadRef.get();
        return (0, response_1.sendSuccess)(res, { ...updatedDoc.data(), type }, 'Lead status updated');
    }
    catch (error) {
        console.error('Error updating lead status:', error);
        return (0, response_1.sendError)(res, 'Failed to update lead status', 500);
    }
});
exports.default = router;
