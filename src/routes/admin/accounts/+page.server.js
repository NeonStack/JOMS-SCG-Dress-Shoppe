import { error, fail } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';

export async function load({ locals }) {
    const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

    if (profilesError) throw error(500, 'Error fetching profiles');
    return { profiles };
}

export const actions = {
    create: async ({ request, locals }) => {
        const formData = await request.formData();
        const email = formData.get('email');
        const password = formData.get('password');
        const first_name = formData.get('first_name');
        const last_name = formData.get('last_name');
        const role = formData.get('role');
        const contact_number = formData.get('contact_number');
        const address = formData.get('address');
        const position = formData.get('position');

        // Check user's role permissions
        const { data: currentUser } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

        if (currentUser.role === 'admin' && role === 'admin') {
            return fail(403, { error: 'Admins cannot create other admins' });
        }

        // Check for duplicate email
        const { data: existingUser } = await supabase
            .auth.admin.listUsers();
        
        if (existingUser.users.some(user => user.email === email)) {
            return fail(400, { error: 'Email already exists' });
        }

        // Create auth user
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true
        });

        if (authError) return fail(500, { error: authError.message });

        // Create profile
        const { error: profileError } = await supabase
            .from('profiles')
            .insert({
                id: authUser.user.id,
                first_name,
                last_name,
                role,
                contact_number,
                address,
                position
            });

        if (profileError) return fail(500, { error: profileError.message });

        return { success: true };
    },

    update: async ({ request, locals }) => {
        const session = await locals.getSession();
        if (!session) return fail(401, { error: 'Unauthorized' });

        const formData = await request.formData();
        const id = formData.get('id');
        const updates = {
            first_name: formData.get('first_name'),
            last_name: formData.get('last_name'),
            contact_number: formData.get('contact_number'),
            address: formData.get('address'),
            position: formData.get('position')
        };

        const { error: updateError } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', id);

        if (updateError) return fail(500, { error: updateError.message });

        return { success: true };
    },

    delete: async ({ request, locals }) => {
        const session = await locals.getSession();
        if (!session) return fail(401, { error: 'Unauthorized' });

        const formData = await request.formData();
        const id = formData.get('id');

        // Delete auth user (this will cascade to profile due to foreign key)
        const { error: deleteError } = await supabase.auth.admin.deleteUser(id);

        if (deleteError) return fail(500, { error: deleteError.message });

        return { success: true };
    }
};
