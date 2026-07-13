"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const firebase_1 = require("../config/firebase");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const response_1 = require("../utils/response");
const router = (0, express_1.Router)();
// @route   POST /api/auth/sync
// @desc    Sync authenticated Firebase user details with Firestore database
// @access  Private
router.post('/sync', auth_middleware_1.requireAuth, [
    (0, express_validator_1.body)('email').isEmail().withMessage('Valid email is required'),
    (0, express_validator_1.body)('name').optional().isString().trim(),
    (0, express_validator_1.body)('phone').optional().isString().trim(),
], validation_middleware_1.validateRequest, async (req, res) => {
    try {
        const { uid, role: authRole } = req.user;
        const { email, name, phone } = req.body;
        const userRef = firebase_1.db.collection('users').doc(uid);
        const doc = await userRef.get();
        let userData = {
            email,
            name: name || email.split('@')[0],
            phone: phone || '',
            updatedAt: new Date().toISOString(),
        };
        if (!doc.exists) {
            // If first user, make them Admin. Otherwise, read standard role
            const usersCount = (await firebase_1.db.collection('users').limit(1).get()).size;
            const assignedRole = usersCount === 0 || email === 'admin@sabi.com' ? 'admin' : 'customer';
            userData = {
                ...userData,
                id: uid,
                role: assignedRole,
                addresses: [],
                walletBalance: 0,
                createdAt: new Date().toISOString(),
            };
            await userRef.set(userData);
            console.log(`Synced new user profile for ${email} with role: ${assignedRole}`);
        }
        else {
            // Keep existing role but update metadata
            await userRef.update(userData);
        }
        const updatedDoc = await userRef.get();
        return (0, response_1.sendSuccess)(res, updatedDoc.data(), 'User profile synchronized');
    }
    catch (error) {
        console.error('Error syncing user:', error);
        return (0, response_1.sendError)(res, 'Failed to synchronize user profile', 500);
    }
});
// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', auth_middleware_1.requireAuth, async (req, res) => {
    try {
        const { uid } = req.user;
        const userRef = firebase_1.db.collection('users').doc(uid);
        const doc = await userRef.get();
        if (!doc.exists) {
            return (0, response_1.sendError)(res, 'User profile does not exist. Please sync first.', 404);
        }
        return (0, response_1.sendSuccess)(res, doc.data(), 'User profile fetched');
    }
    catch (error) {
        console.error('Error getting user profile:', error);
        return (0, response_1.sendError)(res, 'Failed to get user profile', 500);
    }
});
// @route   POST /api/auth/addresses
// @desc    Add a shipping address
// @access  Private
router.post('/addresses', auth_middleware_1.requireAuth, [
    (0, express_validator_1.body)('label').notEmpty().withMessage('Address label is required (e.g. Home, Office)'),
    (0, express_validator_1.body)('street').notEmpty().withMessage('Street address is required'),
    (0, express_validator_1.body)('city').notEmpty().withMessage('City is required'),
    (0, express_validator_1.body)('state').notEmpty().withMessage('State is required'),
    (0, express_validator_1.body)('zip').notEmpty().withMessage('Zip/Postal code is required'),
    (0, express_validator_1.body)('phone').notEmpty().withMessage('Contact phone number is required'),
    (0, express_validator_1.body)('isDefault').optional().isBoolean(),
], validation_middleware_1.validateRequest, async (req, res) => {
    try {
        const { uid } = req.user;
        const newAddress = {
            id: `addr_${Date.now()}`,
            label: req.body.label,
            street: req.body.street,
            city: req.body.city,
            state: req.body.state,
            zip: req.body.zip,
            phone: req.body.phone,
            isDefault: req.body.isDefault || false,
        };
        const userRef = firebase_1.db.collection('users').doc(uid);
        const doc = await userRef.get();
        if (!doc.exists) {
            return (0, response_1.sendError)(res, 'User profile not found', 404);
        }
        const userData = doc.data();
        let addresses = userData.addresses || [];
        if (newAddress.isDefault) {
            // Set all other addresses to false
            addresses = addresses.map((addr) => ({ ...addr, isDefault: false }));
        }
        else if (addresses.length === 0) {
            // First address is default
            newAddress.isDefault = true;
        }
        addresses.push(newAddress);
        await userRef.update({ addresses });
        return (0, response_1.sendSuccess)(res, addresses, 'Address added successfully');
    }
    catch (error) {
        console.error('Error adding address:', error);
        return (0, response_1.sendError)(res, 'Failed to add address', 500);
    }
});
// @route   PUT /api/auth/addresses/:id
// @desc    Update an address or set it as default
// @access  Private
router.put('/addresses/:id', auth_middleware_1.requireAuth, async (req, res) => {
    try {
        const { uid } = req.user;
        const addressId = req.params.id;
        const { label, street, city, state, zip, phone, isDefault } = req.body;
        const userRef = firebase_1.db.collection('users').doc(uid);
        const doc = await userRef.get();
        if (!doc.exists) {
            return (0, response_1.sendError)(res, 'User profile not found', 404);
        }
        const userData = doc.data();
        let addresses = userData.addresses || [];
        const addressIndex = addresses.findIndex((addr) => addr.id === addressId);
        if (addressIndex === -1) {
            return (0, response_1.sendError)(res, 'Address not found', 404);
        }
        // Update details
        const targetAddress = { ...addresses[addressIndex] };
        if (label !== undefined)
            targetAddress.label = label;
        if (street !== undefined)
            targetAddress.street = street;
        if (city !== undefined)
            targetAddress.city = city;
        if (state !== undefined)
            targetAddress.state = state;
        if (zip !== undefined)
            targetAddress.zip = zip;
        if (phone !== undefined)
            targetAddress.phone = phone;
        if (isDefault !== undefined)
            targetAddress.isDefault = isDefault;
        if (targetAddress.isDefault) {
            addresses = addresses.map((addr) => ({
                ...addr,
                isDefault: addr.id === addressId,
            }));
        }
        else {
            addresses[addressIndex] = targetAddress;
        }
        await userRef.update({ addresses });
        return (0, response_1.sendSuccess)(res, addresses, 'Address updated successfully');
    }
    catch (error) {
        console.error('Error updating address:', error);
        return (0, response_1.sendError)(res, 'Failed to update address', 500);
    }
});
// @route   DELETE /api/auth/addresses/:id
// @desc    Delete a shipping address
// @access  Private
router.delete('/addresses/:id', auth_middleware_1.requireAuth, async (req, res) => {
    try {
        const { uid } = req.user;
        const addressId = req.params.id;
        const userRef = firebase_1.db.collection('users').doc(uid);
        const doc = await userRef.get();
        if (!doc.exists) {
            return (0, response_1.sendError)(res, 'User not found', 404);
        }
        const userData = doc.data();
        let addresses = userData.addresses || [];
        const filteredAddresses = addresses.filter((addr) => addr.id !== addressId);
        // If we deleted the default, make the first remaining address default
        if (addresses.find((addr) => addr.id === addressId)?.isDefault && filteredAddresses.length > 0) {
            filteredAddresses[0].isDefault = true;
        }
        await userRef.update({ addresses: filteredAddresses });
        return (0, response_1.sendSuccess)(res, filteredAddresses, 'Address deleted successfully');
    }
    catch (error) {
        console.error('Error deleting address:', error);
        return (0, response_1.sendError)(res, 'Failed to delete address', 500);
    }
});
exports.default = router;
