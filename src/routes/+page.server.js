import { fail, redirect } from '@sveltejs/kit';

export const actions = {
    signin: async ({ request, locals }) => {
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
