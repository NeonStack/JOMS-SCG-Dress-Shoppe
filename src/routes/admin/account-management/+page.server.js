import { error } from '@sveltejs/kit';
import { adminClient } from '$lib/adminClient';

export const load = async ({ locals }) => {
  if (!locals.session) {
    throw error(401, 'Unauthorized');
  }

  try {
    // Get all profile data with position info
    const { data: accounts, error: profileError } = await adminClient
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        role,
        contact_number,
        address,
        position,
        created_at
      `)
      .order('created_at', { ascending: false });

    if (profileError) throw profileError;

    // Get auth users data
    const { data: authUsers, error: authError } = await adminClient.auth.admin.listUsers();
    if (authError) throw authError;

    // Combine and enrich data
    const enrichedAccounts = accounts.map(account => {
      const authUser = authUsers.users?.find(u => u.id === account.id);
      return {
        ...account,
        email: authUser?.email || 'No email',
        lastSignIn: authUser?.last_sign_in_at || null,
        // Map role to display name for frontend
        displayRole: account.role === 'employee' ? 'Tailor' : 
                    account.role === 'admin' ? 'Administrator' : 
                    'Super Administrator',
        // Actual role stays in backend
        accountRole: account.role
      };
    });

    // Get current user role
    const { data: currentUser } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', locals.session.user.id)
      .single();

    if (!currentUser || (currentUser.role !== 'superadmin' && currentUser.role !== 'admin')) {
      throw error(403, 'Forbidden');
    }

    return {
      accounts: enrichedAccounts,
      userRole: currentUser.role
    };
  } catch (err) {
    console.error('Server error:', err);
    throw error(500, 'Server error');
  }
};

export const actions = {
  deleteAccount: async ({ request }) => {
    const formData = await request.formData();
    const userId = formData.get('userId');

    try {
      // Delete from profiles first due to foreign key constraint
      await supabase.from('profiles').delete().eq('id', userId);
      await supabase.auth.admin.deleteUser(userId);

      return { success: true };
    } catch (err) {
      return { error: 'Failed to delete account' };
    }
  },

  updateAccount: async ({ request }) => {
    const formData = await request.formData();
    const userData = Object.fromEntries(formData);

    try {
      await adminClient.from('profiles').update({
        first_name: userData.firstName,
        last_name: userData.lastName,
        contact_number: userData.contactNumber,
        address: userData.address,
        position: userData.position,
        role: userData.role
      }).eq('id', userData.id);

      return { success: true };
    } catch (err) {
      return { error: 'Failed to update account' };
    }
  }
};
