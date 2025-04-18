import { fail, redirect } from '@sveltejs/kit';

export const actions = {
    signin: async ({ request, locals, cookies }) => {
        const formData = await request.formData();
        const email = formData.get('username')?.trim();
        const password = formData.get('password');

        if (!email || !password) {
            return fail(400, {
                error: 'Email and password are required'
            });
        }

        const { data: authData, error: authError } = await locals.supabase.auth.signInWithPassword({
            email,
            password
        });

        if (authError) {
            return fail(400, {
                error: authError.message
            });
        }

        const { data: userData, error: userError } = await locals.supabase
            .from('profiles')
            .select('role')
            .eq('id', authData.user.id)
            .single();

        if (userError || !userData) {
            return fail(400, {
                error: 'Failed to fetch user role'
            });
        }

        // Set session tokens temporarily
        if (authData.session) {
            cookies.set('sb-access-token', authData.session.access_token, {
                path: '/',
                sameSite: 'strict',
                secure: process.env.NODE_ENV === 'production',
                maxAge: 60 * 60 * 24 // 1 day
            });
            
            cookies.set('sb-refresh-token', authData.session.refresh_token, {
                path: '/',
                sameSite: 'strict',
                secure: process.env.NODE_ENV === 'production',
                maxAge: 60 * 60 * 24 * 7 // 1 week
            });
            
            // Clear any previous biometric verification
            cookies.delete('biometric-verified', { path: '/' });
        }

        // For admin and superadmin roles, redirect to biometric verification first
        if (userData.role === 'superadmin' || userData.role === 'admin') {
            return {
                success: true,
                requiresBiometric: true,
                role: userData.role,
                userId: authData.user.id
            };
        }

        // For employees, no biometric needed
        if (userData.role === 'employee') {
            throw redirect(303, '/employee/dashboard');
        }
        
        return fail(400, {
            error: 'Invalid user role'
        });
    },

    verifyBiometric: async ({ request, locals, cookies }) => {
        const formData = await request.formData();
        const verified = formData.get('verified') === 'true';
        const skipBiometric = formData.get('skipBiometric') === 'true';
        const role = formData.get('role');

        // If verification failed and wasn't skipped, sign them out
        if (!verified) {
            // Clear all cookies
            cookies.delete('sb-access-token', { path: '/' });
            cookies.delete('sb-refresh-token', { path: '/' });
            cookies.delete('biometric-verified', { path: '/' });
            
            // Redirect to root instead of returning an error
            throw redirect(303, '/');
        }

        // Log skips for security monitoring
        if (skipBiometric) {
            console.log('Device verification skipped for user with role:', role);
        }

        // Set a verification cookie that expires with the session
        cookies.set('biometric-verified', 'true', {
            path: '/',
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 // 1 day (same as access token)
        });

        // Successful verification (or authorized skip)
        if (role === 'superadmin' || role === 'admin') {
            throw redirect(303, '/admin/dashboard');
        } else {
            throw redirect(303, '/');
        }
    }
};
