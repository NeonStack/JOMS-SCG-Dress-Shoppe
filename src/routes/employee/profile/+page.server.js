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

function toSentenceCase(str) {
    return str
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function cleanWhitespace(str) {
    return str.replace(/\s+/g, ' ').trim();
}

export const actions = {
    updateProfile: async ({ request, locals }) => {
        if (!locals.session) {
            throw error(401, 'Unauthorized');
        }

        const formData = await request.formData();
        const first_name = cleanWhitespace(formData.get('first_name'));
        const last_name = cleanWhitespace(formData.get('last_name'));
        const contact_number = formData.get('contact_number');
        const address = cleanWhitespace(formData.get('address'));

        // Name validations
        if (!first_name) {
            return { success: false, error: 'Name is required' };
        }
        if (!last_name) {
            return { success: false, error: 'Name is required' };
        }
        if (first_name.length < 2 || first_name.length > 50 || 
            last_name.length < 2 || last_name.length > 50) {
            return { success: false, error: 'Must be between 2-50 characters' };
        }
        if (!/^[a-zA-Z\s.]+$/.test(first_name) || !/^[a-zA-Z\s.]+$/.test(last_name)) {
            return { success: false, error: 'Only letters, spaces, and dots allowed' };
        }

        // Phone validation
        if (!contact_number) {
            return { success: false, error: 'Contact number is required' };
        }
        if (!/^09\d{9}$/.test(contact_number)) {
            return { success: false, error: 'Must be 11 digits starting with 09' };
        }

        // Address validation
        if (!address) {
            return { success: false, error: 'Address is required' };
        }
        if (address.length < 5 || address.length > 200) {
            return { success: false, error: 'Must be between 5-200 characters' };
        }
        if (!/^[a-zA-Z0-9\s,.\-#]+$/.test(address)) {
            return { success: false, error: 'Only letters, numbers, spaces, commas, dots, hyphens, and #' };
        }

        const updates = {
            first_name: toSentenceCase(first_name),
            last_name: toSentenceCase(last_name),
            contact_number,
            address: toSentenceCase(address)
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
