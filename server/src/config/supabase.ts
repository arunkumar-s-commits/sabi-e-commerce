import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Backend uses the Service Role Key to bypass RLS for admin operations
export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
