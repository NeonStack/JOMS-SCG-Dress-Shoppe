import { fail, redirect } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';

export const actions = {
    signin: async ({ request }) => {
        const formData = await request.formData();
        const email = formData.get('username')?.trim();
        const password = formData.get('password');

        // Basic validation
        if (!email || !password) {
            return fail(400, {
                error: 'Email and password are required',
                email
            });
        }

        // Try to sign in
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (authError) {
            return fail(400, {
                error: authError.message,
                email
            });
        }

        // Get user role
        const { data: userData, error: userError } = await supabase
            .from('profiles')  // Note: 'profiles' not 'profile'
            .select('role')
            .eq('id', authData.user.id)
            .single();

        if (userError || !userData) {
            return fail(400, {
                error: 'Failed to fetch user role',
                email
            });
        }

        // Redirect based on role
        switch (userData.role) {
            case 'superadmin':
            case 'admin':
                throw redirect(303, '/admin/dashboard');
            case 'employee':
                throw redirect(303, '/employee/dashboard');
            default:
                return fail(400, {
                    error: 'Invalid user role',
                    email
                });
        }
    }
};
