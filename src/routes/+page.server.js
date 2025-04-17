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

        // Only allow skipping if explicit "skip" flag is provided
        if (!verified && !skipBiometric) {
            // Failed biometric verification - sign out
            cookies.delete('sb-access-token', { path: '/' });
            cookies.delete('sb-refresh-token', { path: '/' });
            
            return fail(401, {
                error: 'Biometric verification failed'
            });
        }

        // For security, log cases where verification was skipped
        if (skipBiometric) {
            console.log('Biometric verification skipped for user with role:', role);
        }

        // Successful verification (or authorized skip)
        if (role === 'superadmin' || role === 'admin') {
            throw redirect(303, '/admin/dashboard');
        } else {
            throw redirect(303, '/');
        }
    }
};
