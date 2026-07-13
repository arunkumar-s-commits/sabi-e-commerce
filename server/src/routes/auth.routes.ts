import { Router } from 'express';
import { body } from 'express-validator';
import { supabase } from '../config/supabase';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();

// @route   POST /api/auth/sync
// @desc    Sync authenticated Supabase user details with profiles table
// @access  Private
router.post(
  '/sync',
  requireAuth,
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('name').optional().isString().trim(),
    body('phone').optional().isString().trim(),
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const { uid } = req.user!;
      const { email, name, phone } = req.body;

      const { data: doc, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      let userData: any = {
        email,
        full_name: name || email.split('@')[0],
        phone: phone || '',
      };

      if (!doc) {
        // If first user, make them Admin. Otherwise, read standard role
        const { count, error: countError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        const assignedRole = count === 0 || email === 'admin@sabi.com' ? 'admin' : 'user';
        
        userData = {
          ...userData,
          id: uid,
          role: assignedRole,
          addresses: [],
          wallet_balance: 0,
        };

        const { error: insertError } = await supabase.from('profiles').insert([userData]);
        if (insertError) throw insertError;
        
        console.log(`Synced new user profile for ${email} with role: ${assignedRole}`);
      } else {
        // Keep existing role but update metadata
        const { error: updateError } = await supabase
          .from('profiles')
          .update(userData)
          .eq('id', uid);
        if (updateError) throw updateError;
      }

      const { data: updatedDoc } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single();

      return sendSuccess(res, updatedDoc, 'User profile synchronized');
    } catch (error: any) {
      console.error('Error syncing user:', error);
      return sendError(res, 'Failed to synchronize user profile', 500);
    }
  }
);

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: any) => {
  try {
    const { uid } = req.user!;
    const { data: doc, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .single();

    if (error || !doc) {
      return sendError(res, 'User profile does not exist. Please sync first.', 404);
    }

    return sendSuccess(res, doc, 'User profile fetched');
  } catch (error: any) {
    console.error('Error getting user profile:', error);
    return sendError(res, 'Failed to get user profile', 500);
  }
});

// @route   POST /api/auth/addresses
// @desc    Add a shipping address
// @access  Private
router.post(
  '/addresses',
  requireAuth,
  [
    body('label').notEmpty().withMessage('Address label is required (e.g. Home, Office)'),
    body('street').notEmpty().withMessage('Street address is required'),
    body('city').notEmpty().withMessage('City is required'),
    body('state').notEmpty().withMessage('State is required'),
    body('zip').notEmpty().withMessage('Zip/Postal code is required'),
    body('phone').notEmpty().withMessage('Contact phone number is required'),
    body('isDefault').optional().isBoolean(),
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const { uid } = req.user!;
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

      const { data: doc, error } = await supabase
        .from('profiles')
        .select('addresses')
        .eq('id', uid)
        .single();

      if (error || !doc) {
        return sendError(res, 'User profile not found', 404);
      }

      let addresses: any[] = doc.addresses || [];

      if (newAddress.isDefault) {
        // Set all other addresses to false
        addresses = addresses.map((addr) => ({ ...addr, isDefault: false }));
      } else if (addresses.length === 0) {
        // First address is default
        newAddress.isDefault = true;
      }

      addresses.push(newAddress);
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ addresses })
        .eq('id', uid);

      if (updateError) throw updateError;

      return sendSuccess(res, addresses, 'Address added successfully');
    } catch (error) {
      console.error('Error adding address:', error);
      return sendError(res, 'Failed to add address', 500);
    }
  }
);

// @route   PUT /api/auth/addresses/:id
// @desc    Update an address or set it as default
// @access  Private
router.put('/addresses/:id', requireAuth, async (req: AuthenticatedRequest, res: any) => {
  try {
    const { uid } = req.user!;
    const addressId = req.params.id;
    const { label, street, city, state, zip, phone, isDefault } = req.body;

    const { data: doc, error } = await supabase
        .from('profiles')
        .select('addresses')
        .eq('id', uid)
        .single();

    if (error || !doc) {
      return sendError(res, 'User profile not found', 404);
    }

    let addresses: any[] = doc.addresses || [];

    const addressIndex = addresses.findIndex((addr) => addr.id === addressId);
    if (addressIndex === -1) {
      return sendError(res, 'Address not found', 404);
    }

    // Update details
    const targetAddress = { ...addresses[addressIndex] };
    if (label !== undefined) targetAddress.label = label;
    if (street !== undefined) targetAddress.street = street;
    if (city !== undefined) targetAddress.city = city;
    if (state !== undefined) targetAddress.state = state;
    if (zip !== undefined) targetAddress.zip = zip;
    if (phone !== undefined) targetAddress.phone = phone;
    if (isDefault !== undefined) targetAddress.isDefault = isDefault;

    if (targetAddress.isDefault) {
      addresses = addresses.map((addr) => ({
        ...addr,
        isDefault: addr.id === addressId,
      }));
    } else {
      addresses[addressIndex] = targetAddress;
    }

    const { error: updateError } = await supabase
        .from('profiles')
        .update({ addresses })
        .eq('id', uid);

    if (updateError) throw updateError;

    return sendSuccess(res, addresses, 'Address updated successfully');
  } catch (error) {
    console.error('Error updating address:', error);
    return sendError(res, 'Failed to update address', 500);
  }
});

// @route   DELETE /api/auth/addresses/:id
// @desc    Delete a shipping address
// @access  Private
router.delete('/addresses/:id', requireAuth, async (req: AuthenticatedRequest, res: any) => {
  try {
    const { uid } = req.user!;
    const addressId = req.params.id;

    const { data: doc, error } = await supabase
        .from('profiles')
        .select('addresses')
        .eq('id', uid)
        .single();

    if (error || !doc) {
      return sendError(res, 'User not found', 404);
    }

    let addresses: any[] = doc.addresses || [];

    const filteredAddresses = addresses.filter((addr) => addr.id !== addressId);
    
    // If we deleted the default, make the first remaining address default
    if (addresses.find((addr) => addr.id === addressId)?.isDefault && filteredAddresses.length > 0) {
      filteredAddresses[0].isDefault = true;
    }

    const { error: updateError } = await supabase
        .from('profiles')
        .update({ addresses: filteredAddresses })
        .eq('id', uid);

    if (updateError) throw updateError;

    return sendSuccess(res, filteredAddresses, 'Address deleted successfully');
  } catch (error) {
    console.error('Error deleting address:', error);
    return sendError(res, 'Failed to delete address', 500);
  }
});

export default router;
