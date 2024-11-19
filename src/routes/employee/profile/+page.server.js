import { error } from '@sveltejs/kit';

export const load = async ({ locals }) => {
    if (!locals.session) {
        throw error(401, 'Unauthorized');
    }

    const { data: profile, error: profileError } = await locals.supabase
        .from('profiles')
        .select('*')
        .eq('id', locals.session.user.id)
        .single();

    if (profileError) {
        throw error(500, 'Error fetching profile');
    }

    // No need to fetch user data separately, it's in the session
    return {
        profile: {
            ...profile,
            email: locals.session.user.email,
            emailConfirmed: locals.session.user.email_confirmed_at ? true : false,
            lastSignIn: locals.session.user.last_sign_in_at
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

        const { error: updateError } = await locals.supabase
            .from('profiles')
            .update(updates)
            .eq('id', locals.session.user.id);

        if (updateError) {
            return { success: false, error: 'Failed to update profile' };
        }

        return { success: true };
    }
};
