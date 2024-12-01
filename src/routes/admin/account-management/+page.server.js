import { error } from '@sveltejs/kit';
import { adminClient } from '$lib/adminClient';

// Update validateInput functions to properly return error messages
const validateInput = {
  name: (name) => {
    if (!name || typeof name !== 'string') return 'Name is required';
    name = name.trim();
    if (name.length < 2 || name.length > 50) return 'Must be between 2-50 characters';
    if (!/^[a-zA-Z\s.]+$/.test(name)) return 'Only letters, spaces, and dots allowed';
    return null;
  },
  phone: (phone) => {
    if (!phone || typeof phone !== 'string') return 'Phone number is required';
    if (!/^09\d{9}$/.test(phone)) return 'Phone number must be 11 digits starting with 09';
    return null;
  },
  address: (address) => {
    if (!address || typeof address !== 'string') return 'Address is required';
    address = address.trim();
    if (address.length < 5 || address.length > 200) return 'Address must be between 5-200 characters';
    if (!/^[a-zA-Z0-9\s,.\-#]+$/.test(address)) return 'Address contains invalid characters';
    return null;
  },
  position: (position) => {
    if (!position || typeof position !== 'string') return 'Position is required';
    position = position.trim();
    if (position.length < 2 || position.length > 50) return 'Position must be between 2-50 characters';
    if (!/^[a-zA-Z\s\-]+$/.test(position)) return 'Position can only contain letters, spaces, and hyphens';
    return null;
  }
};

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

    // Get list of emails for validation
    const existingEmails = authUsers.users.map(user => user.email);

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
      existingEmails,
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
    
    const errors = {};
    const firstNameError = validateInput.name(userData.firstName);
    if (firstNameError) errors.firstName = firstNameError;
    
    const lastNameError = validateInput.name(userData.lastName);
    if (lastNameError) errors.lastName = lastNameError;
    
    const phoneError = validateInput.phone(userData.contactNumber);
    if (phoneError) errors.contactNumber = phoneError;
    
    const addressError = validateInput.address(userData.address);
    if (addressError) errors.address = addressError;
    
    const positionError = validateInput.position(userData.position);
    if (positionError) errors.position = positionError;

    if (Object.keys(errors).length > 0) {
      return { error: 'Validation failed', errors };
    }

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

    // Validation
    const errors = {};
    const firstNameError = validateInput.name(firstName);
    if (firstNameError) errors.firstName = firstNameError;
    
    const lastNameError = validateInput.name(lastName);
    if (lastNameError) errors.lastName = lastNameError;
    
    const phoneError = validateInput.phone(contactNumber);
    if (phoneError) errors.contactNumber = phoneError;
    
    const addressError = validateInput.address(address);
    if (addressError) errors.address = addressError;
    
    const positionError = validateInput.position(position);
    if (positionError) errors.position = positionError;

    if (Object.keys(errors).length > 0) {
      return { error: 'Validation failed', errors };
    }

    try {
      // Create auth user first
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });

      if (authError) throw authError;

      // Create profile with the new user ID
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
        // Rollback: delete auth user if profile creation fails
        await adminClient.auth.admin.deleteUser(authData.user.id);
        throw profileError;
      }

      return {
        status: 200,
        body: { success: true }
      };

    } catch (err) {
      console.error('Error creating account:', err);
      return {
        status: 500,
        body: { error: err.message || 'Failed to create account' }
      };
    }
  }
};
