// src/lib/adminClient.js
import { createClient } from '@supabase/supabase-js';
import { PRIVATE_SUPABASE_URL, PRIVATE_SUPABASE_SERVICE_KEY } from '$env/static/private';

const supabaseUrl = PRIVATE_SUPABASE_URL;
const supabaseServiceKey = PRIVATE_SUPABASE_SERVICE_KEY;

export const adminClient = createClient(supabaseUrl, supabaseServiceKey);