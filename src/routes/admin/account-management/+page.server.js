import { error } from '@sveltejs/kit';
import { adminClient } from '$lib/adminClient';

export const load = async ({ locals }) => {
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
  deleteAccount: async ({ request, locals }) => {
    const formData = await request.formData();
    const userId = formData.get('userId');

    try {
      // Get current user's role and target account's role
      const { data: currentUser } = await adminClient
        .from('profiles')
        .select('role')
        .eq('id', locals.session.user.id)
        .single();

      const { data: targetUser } = await adminClient
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      // Check permissions
      if (!currentUser || !targetUser) {
        return { error: 'User not found' };
      }

      if (currentUser.role === 'admin' && targetUser.role !== 'employee') {
        return { error: 'Insufficient permissions' };
      }

      if (currentUser.role !== 'superadmin' && currentUser.role !== 'admin') {
        return { error: 'Unauthorized' };
      }

      // Proceed with deletion
      await adminClient.from('profiles').delete().eq('id', userId);
      await adminClient.auth.admin.deleteUser(userId);

      return { success: true };
    } catch (err) {
      console.error('Error deleting account:', err);
      return { error: err.message || 'Failed to delete account' };
    }
  },

  updateAccount: async ({ request }) => {
    const formData = await request.formData();
    const userData = Object.fromEntries(formData);
    const password = formData.get('password');

    try {
      // Update password if provided
      if (password) {
        await adminClient.auth.admin.updateUserById(userData.id, { password });
      }

      // Update profile information
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
  },

  createAccount: async ({ request }) => {
    const formData = await request.formData();
    const email = formData.get('email');
    const password = formData.get('password');
    const firstName = formData.get('firstName');
    const lastName = formData.get('lastName');
    const role = formData.get('role');
    const position = formData.get('position');
    const contactNumber = formData.get('contactNumber');
    const address = formData.get('address');

    try {
      // Check if user already exists
      const { data: existingUser } = await adminClient.auth.admin.listUsers({
        filter: `email eq '${email}'`
      });

      if (existingUser?.users?.length > 0) {
        return {
          status: 400,
          body: { error: 'An account with this email already exists' }
        };
      }

      // Create auth user
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          role: role
        }
      });

      if (authError) {
        return {
          status: 400,
          body: { error: authError.message }
        };
      }

      // Create profile
      const { error: profileError } = await adminClient
        .from('profiles')
        .insert({
          id: authData.user.id,
          first_name: firstName,
          last_name: lastName,
          role: role,
          position: position,
          contact_number: contactNumber,
          address: address
        });

      if (profileError) {
        // Clean up auth user if profile creation fails
        await adminClient.auth.admin.deleteUser(authData.user.id);
        return {
          status: 400,
          body: { error: profileError.message }
        };
      }

      return { 
        status: 200,
        body: { success: true }
      };
    } catch (err) {
      console.error('Server error creating account:', err);
      return {
        status: 500,
        body: { error: err.message || 'Internal server error' }
      };
    }
  }
};
