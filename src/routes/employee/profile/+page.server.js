import { error } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';

export const load = async ({ locals }) => {
    if (!locals.session) {
        throw error(401, 'Unauthorized');
    }

    // Fetch profile data from profiles table
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', locals.session.user.id)
        .single();

    if (profileError) {
        throw error(500, 'Error fetching profile');
    }

    // Fetch user data from auth.users using session
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
        throw error(500, 'Error fetching user data');
    }

    return {
        profile: {
            ...profile,
            email: user.email,
            emailConfirmed: user.email_confirmed_at ? true : false,
            lastSignIn: user.last_sign_in_at
        }
    };
};

export const actions = {
    updateProfile: async ({ request, locals }) => {
        if (!locals.session) {
            throw error(401, 'Unauthorized');
        }

        const formData = await request.formData();
        const updates = {
            first_name: formData.get('first_name'),
            last_name: formData.get('last_name'),
            contact_number: formData.get('contact_number'),
            address: formData.get('address')
        };

        const { error: updateError } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', locals.session.user.id);

        if (updateError) {
            return { success: false, error: 'Failed to update profile' };
        }

        return { success: true };
    }
};
