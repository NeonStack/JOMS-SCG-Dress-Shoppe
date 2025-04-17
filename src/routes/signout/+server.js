// src/routes/auth/signout/+server.js
import { redirect } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';

export const GET = async ({ locals, cookies, request }) => {
    // Check if the request is from a mobile device
    const userAgent = request.headers.get('user-agent') || '';
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
    
    // 1. Immediately delete all cookies
    cookies.delete('sb-access-token', { path: '/' });
    cookies.delete('sb-refresh-token', { path: '/' });
    cookies.delete('biometric-verified', { path: '/' });
    
    // 2. For mobile devices, use a more aggressive redirect approach
    if (isMobile) {
        // Return an extremely lightweight HTML response
        // that forces an immediate redirect without any processing
        return new Response(
            `<html><head><meta http-equiv="refresh" content="0;url=/" /></head>
             <body><script>window.location.replace('/');</script></body></html>`,
            {
                status: 200,
                headers: {
                    'Content-Type': 'text/html',
                    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
                }
            }
        );
    }
    
    // 3. For desktop browsers, we can use a slightly more complex approach
    // with additional cleanup that still maintains performance
    const htmlResponse = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta http-equiv="refresh" content="0;url=/" />
          <script>
            try {
              localStorage.clear();
              sessionStorage.clear();
              window.location.replace('/');
            } catch (e) {}
          </script>
          <title>Signing out...</title>
        </head>
        <body>
          <p>Redirecting...</p>
        </body>
      </html>
    `;
    
    // 4. Handle Supabase sign-out in a non-blocking way
    // Don't wait for this to complete - fire and forget
    try {
        setTimeout(() => {
            locals.supabase.auth.signOut()
                .catch(err => console.error('Background sign out error:', err));
        }, 0);
    } catch (error) {
        // Ignore any errors - we've already deleted the cookies
        // which effectively signs the user out from our app
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