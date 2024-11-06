// src/routes/auth/signout/+server.js
import { redirect } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';

export const GET = async () => {
  await supabase.auth.signOut();
  throw redirect(303, '/');
};