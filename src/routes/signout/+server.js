// src/routes/auth/signout/+server.js
import { redirect } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';

export const GET = async ({ locals, cookies }) => {
    // Clear all authentication cookies immediately
    cookies.delete('sb-access-token', { path: '/' });
    cookies.delete('sb-refresh-token', { path: '/' });
    cookies.delete('biometric-verified', { path: '/' });
    
    // Immediately return HTML that redirects the client
    // This executes before even attempting to contact Supabase
    const htmlResponse = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta http-equiv="refresh" content="0;url=/" />
          <script>
            // Clear any browser storage
            try {
              localStorage.clear();
              sessionStorage.clear();
              
              // Force navigation immediately without waiting
              window.location.href = '/';
            } catch (e) {
              console.error(e);
            }
          </script>
          <title>Signing out...</title>
        </head>
        <body>
          <p>Signing you out...</p>
        </body>
      </html>
    `;
    
    // Fire and forget the Supabase signout
    // We don't wait for this to complete since we've already cleared cookies
    try {
      locals.supabase.auth.signOut().catch(err => console.error('Error during Supabase sign out:', err));
    } catch (error) {
      console.error('Error initiating sign out:', error);
    }
    
    return new Response(htmlResponse, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Clear-Site-Data': '"cache", "cookies", "storage"',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    });
};