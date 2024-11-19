// src/routes/auth/signout/+server.js
import { redirect } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';

export const GET = async ({ locals, cookies }) => {
    await locals.supabase.auth.signOut();
    
    cookies.delete('sb-access-token', { path: '/' });
    cookies.delete('sb-refresh-token', { path: '/' });
    
    return new Response(null, {
        status: 303,
        headers: {
            'Location': '/',
            'Clear-Site-Data': '"cache", "cookies", "storage"',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
        }
    });
};