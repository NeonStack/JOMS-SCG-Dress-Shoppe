<script>
    // Placeholder data for users
    let users = [
      { name: 'Admin', role: 'Owner', accessLevel: 'Full' },
      { name: 'Alice', role: 'Employee', accessLevel: 'Limited' }
    ];
  
    let newUser = {
      name: '',
      role: '',
      accessLevel: ''
    };
  
    function addUser() {
      // Logic to add a user
      users = [...users, newUser];
      newUser = { name: '', role: '', accessLevel: '' };
    }
  </script>
  
  <div class="space-y-8">
    <!-- User Management -->
    <div class="bg-primary-light p-4 rounded-lg shadow">
      <h2 class="text-2xl font-bold mb-2">User Management</h2>
      <ul>
        {#each users as user}
          <li>{user.name} - Role: {user.role}, Access Level: {user.accessLevel}</li>
        {/each}
      </ul>
    </div>
  
    <!-- Add/Edit User Form -->
    <div class="bg-primary-light p-4 rounded-lg shadow">
      <h2 class="text-2xl font-bold mb-2">Add/Edit User</h2>
      <form on:submit|preventDefault={addUser}>
        <input type="text" placeholder="Name" bind:value={newUser.name} class="w-full p-2 mb-2 border rounded" />
        <select bind:value={newUser.role} class="w-full p-2 mb-2 border rounded">
          <option value="" disabled selected>Select Role</option>
          <option value="Owner">Owner</option>
          <option value="Employee">Employee</option>
        </select>
        <select bind:value={newUser.accessLevel} class="w-full p-2 mb-2 border rounded">
          <option value="" disabled selected>Select Access Level</option>
          <option value="Full">Full</option>
          <option value="Limited">Limited</option>
        </select>
        <button type="submit" class="p-2 bg-primary-dark text-white rounded">Add User</button>
      </form>
    </div>
  </div>  