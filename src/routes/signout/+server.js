// src/routes/auth/signout/+server.js
import { redirect } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';

export const GET = async ({ locals, cookies }) => {
    try {
        // Sign out from Supabase
        await locals.supabase.auth.signOut();
        
        // Clear all authentication cookies
        cookies.delete('sb-access-token', { path: '/' });
        cookies.delete('sb-refresh-token', { path: '/' });
        cookies.delete('biometric-verified', { path: '/' });
        
        // Return a client-side JavaScript-based redirect for immediate effect
        return new Response(
            `<html>
                <head>
                    <title>Signing out...</title>
                    <script>
                        // Clear any localStorage/sessionStorage data
                        window.localStorage.clear();
                        window.sessionStorage.clear();
                        // Redirect to login page
                        window.location.href = '/';
                    </script>
                </head>
                <body>
                    <p>Signing you out...</p>
                </body>
            </html>`,
            {
                status: 200,
                headers: {
                    'Content-Type': 'text/html',
                    'Clear-Site-Data': '"cache", "cookies", "storage"',
                    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
                }
            }
        );
    } catch (error) {
        console.error('Error during sign-out:', error);
        
        // Fallback to redirect if something goes wrong
        return new Response(null, {
            status: 303,
            headers: {
                'Location': '/',
                'Clear-Site-Data': '"cache", "cookies", "storage"',
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
            }
        });
    }
};