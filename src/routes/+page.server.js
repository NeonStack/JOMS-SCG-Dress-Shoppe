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

        if (authData.session) {
            cookies.set('sb-access-token', authData.session.access_token, {
                path: '/',
                sameSite: 'strict',
                secure: process.env.NODE_ENV === 'production',
                maxAge: 60 * 60 * 24 // 1 day
            })
            
            cookies.set('sb-refresh-token', authData.session.refresh_token, {
                path: '/',
                sameSite: 'strict',
                secure: process.env.NODE_ENV === 'production',
                maxAge: 60 * 60 * 24 * 7 // 1 week
            })
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

        switch (userData.role) {
            case 'superadmin':
            case 'admin':
                throw redirect(303, '/admin/dashboard');
            case 'employee':
                throw redirect(303, '/employee/dashboard');
            default:
                return fail(400, {
                    error: 'Invalid user role'
                });
        }
    }
};
