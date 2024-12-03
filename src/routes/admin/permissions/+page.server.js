import { error } from '@sveltejs/kit';

export const load = async ({ locals, url }) => {
    if (locals.userRole !== 'superadmin') {
        throw error(403, 'Unauthorized');
    }

    // Get selected admin from URL
    const selectedAdminId = url.searchParams.get('admin');

    // Get all admin users
    const { data: admins } = await locals.supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('role', 'admin');

    // Get all permissions
    const { data: permissions } = await locals.supabase
        .from('admin_permissions')
        .select('*');

    return {
        admins,
        permissions,
        selectedAdminId
    };
};

export const actions = {
    updatePermissions: async ({ request, locals }) => {
        if (locals.userRole !== 'superadmin') {
            throw error(403, 'Unauthorized');
        }

        const formData = await request.formData();
        const adminId = formData.get('adminId');
        const permissions = JSON.parse(formData.get('permissions'));

        // Delete existing permissions for this admin
        await locals.supabase
            .from('admin_permissions')
            .delete()
            .eq('admin_id', adminId);

        // Insert new permissions
        await locals.supabase
            .from('admin_permissions')
            .insert(permissions.map(route => ({
                admin_id: adminId,
                route_path: route,
                is_permitted: true
            })));

        return { success: true };
    }
};