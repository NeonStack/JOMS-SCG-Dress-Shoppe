// src/lib/adminClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY; // Add this to .env

export const adminClient = createClient(supabaseUrl, supabaseServiceKey);