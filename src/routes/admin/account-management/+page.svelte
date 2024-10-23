<script>
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabaseClient";
  import { fade, slide } from "svelte/transition";

  // Constants
  const EMAIL_DOMAIN = "@scg.shop";

  // Reactive states
  let employees = [];
  let admins = [];
  let loading = true;
  let activeTab = "employees";
  let showCreateModal = false;
  let sortField = "created_at";
  let sortOrder = "desc";
  let dateRange = { start: "", end: "" };
  let searchQuery = "";
  let hasActiveOrders = null;

  // Form states
  let newAccount = {
    firstName: "",
    lastName: "",
    username: "", // Will be converted to username@scg.shop
    password: "",
    confirmPassword: "",
    role: "employee",
  };

  // Error states
  let errors = {};

  onMount(async () => {
    await fetchAccounts();
    loading = false;
  });

  async function fetchAccounts() {
    try {
      // Get profiles with their related orders
      const { data: profilesData, error } = await supabase
        .from("profiles")
        .select(
          `
                *,
                orders!assigned_to(
                    id,
                    status,
                    total_amount,
                    created_at,
                    due_date,
                    student:students(
                        first_name,
                        last_name,
                        course:courses(name)
                    )
                )
            `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get auth data to get emails (usernames)
      const { data: authUsers, error: authError } =
        await supabase.auth.admin.listUsers();
      if (authError) throw authError;

      // Process employees and admins with their orders
      const processProfiles = (profiles) => {
        return profiles.map((profile) => {
          const authUser = authUsers?.find((user) => user.id === profile.id);
          const username = authUser?.email?.replace(EMAIL_DOMAIN, ""); // Remove @scg.shop

          // Process orders
          const activeOrders =
            profile.orders?.filter((o) => o.status !== "COMPLETED") || [];
          const completedOrders =
            profile.orders?.filter((o) => o.status === "COMPLETED") || [];

          return {
            ...profile,
            username,
            activeOrders,
            completedOrders,
            activeOrdersCount: activeOrders.length,
            completedOrdersCount: completedOrders.length,
            totalEarnings: completedOrders.reduce(
              (sum, order) => sum + (order.total_amount || 0),
              0
            ),
            // Add order details for display
            orderDetails: profile.orders?.map((order) => ({
              id: order.id,
              status: order.status,
              amount: order.total_amount,
              dueDate: order.due_date,
              studentName: `${order.student.first_name} ${order.student.last_name}`,
              course: order.student.course.name,
              createdAt: new Date(order.created_at).toLocaleDateString(),
            })),
          };
        });
      };

      employees = processProfiles(
        profilesData.filter((p) => p.role === "employee")
      );
      admins = processProfiles(profilesData.filter((p) => p.role === "admin"));
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  }

  async function createAccount() {
    if (!validateForm()) return;

    try {
      // Create email by appending domain
      const email = `${newAccount.username.toLowerCase()}${EMAIL_DOMAIN}`;

      // Check if username already exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const usernameExists = existingUsers?.some(
        (user) => user.email.toLowerCase() === email.toLowerCase()
      );

      if (usernameExists) {
        errors.username = "Username already exists";
        return;
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: newAccount.password,
        options: {
          data: {
            first_name: newAccount.firstName,
            last_name: newAccount.lastName,
            role: newAccount.role,
          },
        },
      });

      if (authError) throw authError;

      // Create profile
      const { error: profileError } = await supabase.from("profiles").insert({
        id: authData.user.id,
        first_name: newAccount.firstName,
        last_name: newAccount.lastName,
        role: newAccount.role,
      });

      if (profileError) throw profileError;

      showCreateModal = false;
      await fetchAccounts();
      resetForm();
    } catch (error) {
      console.error("Error creating account:", error);
      errors.submit = error.message;
    }
  }

  // Login function
  async function login(username, password) {
    try {
      const email = `${username.toLowerCase()}${EMAIL_DOMAIN}`;
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error logging in:", error);
      throw error;
    }
  }

  function validateForm() {
    errors = {};

    if (!newAccount.firstName) errors.firstName = "First name is required";
    if (!newAccount.lastName) errors.lastName = "Last name is required";
    if (!newAccount.username) errors.username = "Username is required";
    if (!newAccount.password) errors.password = "Password is required";

    // Username validation
    if (newAccount.username) {
      // Only allow letters, numbers, and underscores
      if (!/^[a-zA-Z0-9_]+$/.test(newAccount.username)) {
        errors.username =
          "Username can only contain letters, numbers, and underscores";
      }
    }

    if (newAccount.password !== newAccount.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
    if (newAccount.password && newAccount.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }

    return Object.keys(errors).length === 0;
  }

  function resetForm() {
    newAccount = {
      firstName: "",
      lastName: "",
      username: "",
      password: "",
      confirmPassword: "",
      role: "employee",
    };
    errors = {};
  }

  $: filteredAccounts = (activeTab === "employees" ? employees : admins)
    .filter((account) => {
      if (searchQuery) {
        const search = searchQuery.toLowerCase();
        return (
          account.first_name.toLowerCase().includes(search) ||
          account.last_name.toLowerCase().includes(search) ||
          account.username.toLowerCase().includes(search)
        );
      }
      if (hasActiveOrders !== null) {
        return hasActiveOrders
          ? account.activeOrdersCount > 0
          : account.activeOrdersCount === 0;
      }
      return true;
    })
    .sort((a, b) => {
      const modifier = sortOrder === "asc" ? 1 : -1;
      return a[sortField] > b[sortField] ? modifier : -modifier;
    });
</script>

<div class="container mx-auto p-6">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold text-foreground">Account Management</h1>
    <button on:click={() => (showCreateModal = true)} class="btn-primary">
      Create New Account
    </button>
  </div>

  <!-- Tab Navigation -->
  <div class="flex gap-4 mb-6">
    <button
      class="tab-button"
      class:active={activeTab === "employees"}
      on:click={() => (activeTab = "employees")}
    >
      Employees
    </button>
    <button
      class="tab-button"
      class:active={activeTab === "admins"}
      on:click={() => (activeTab = "admins")}
    >
      Administrators
    </button>
  </div>

  <!-- Filters -->
  <div class="filters-container">
    <input
      type="text"
      placeholder="Search by name or ID..."
      bind:value={searchQuery}
      class="filter-input"
    />
    <select bind:value={sortField} class="filter-select">
      <option value="created_at">Created Date</option>
      <option value="first_name">First Name</option>
      <option value="last_name">Last Name</option>
      <option value="activeOrdersCount">Active Orders</option>
      <option value="completedOrdersCount">Completed Orders</option>
    </select>
    <select bind:value={sortOrder} class="filter-select">
      <option value="asc">Ascending</option>
      <option value="desc">Descending</option>
    </select>
    {#if activeTab === "employees"}
      <select bind:value={hasActiveOrders} class="filter-select">
        <option value={null}>All Orders</option>
        <option value={true}>Has Active Orders</option>
        <option value={false}>No Active Orders</option>
      </select>
    {/if}
  </div>

  <!-- Accounts Table -->
  {#if loading}
    <div class="loading-spinner" />
  {:else}
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr>
            <th class="table-header">ID</th>
            <th class="table-header">First Name</th>
            <th class="table-header">Last Name</th>
            <th class="table-header">Created Date</th>
            {#if activeTab === "employees"}
              <th class="table-header">Active Orders</th>
              <th class="table-header">Completed Orders</th>
            {:else}
              <th class="table-header">Status</th>
              <th class="table-header">Last Login</th>
            {/if}
            <th class="table-header">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each filteredAccounts as account (account.id)}
            <tr transition:fade class="table-row">
              <td class="table-cell">{account.id}</td>
              <td class="table-cell">{account.first_name}</td>
              <td class="table-cell">{account.last_name}</td>
              <td class="table-cell">
                {new Date(account.created_at).toLocaleDateString()}
              </td>
              {#if activeTab === "employees"}
                <td class="table-cell">
                  <span class="badge-active">
                    {account.activeOrdersCount}
                  </span>
                </td>
                <td class="table-cell">
                  <span class="badge-completed">
                    {account.completedOrdersCount}
                  </span>
                </td>
              {:else}
                <td class="table-cell">
                  <span class="badge-status"> Active </span>
                </td>
                <td class="table-cell">
                  {account.last_login_at
                    ? new Date(account.last_login_at).toLocaleDateString()
                    : "Never"}
                </td>
              {/if}
              <td class="table-cell">
                <button class="btn-icon"> Edit </button>
                <button class="btn-icon-danger"> Delete </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<!-- Create Account Modal -->
{#if showCreateModal}
  <div class="modal-overlay" transition:fade>
    <div class="modal-container" transition:slide>
      <h2 class="modal-title">
        Create New {newAccount.role === "employee" ? "Employee" : "Admin"} Account
      </h2>

      <form on:submit|preventDefault={createAccount} class="modal-form">
        <div class="form-group">
          <label for="firstName">First Name</label>
          <input
            type="text"
            id="firstName"
            bind:value={newAccount.firstName}
            class="form-input"
            class:error={errors.firstName}
            maxlength="50"
          />
          {#if errors.firstName}
            <span class="error-message">{errors.firstName}</span>
          {/if}
        </div>

        <div class="form-group">
          <label for="lastName">Last Name</label>
          <input
            type="text"
            id="lastName"
            bind:value={newAccount.lastName}
            class="form-input"
            class:error={errors.lastName}
            maxlength="50"
          />
          {#if errors.lastName}
            <span class="error-message">{errors.lastName}</span>
          {/if}
        </div>

        <div class="form-group">
          <label for="username">Username</label>
          <input
            type="text"
            id="username"
            bind:value={newAccount.username}
            class="form-input"
            class:error={errors.username}
          />
          {#if errors.username}
            <span class="error-message">{errors.username}</span>
          {/if}
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            type="password"
            id="password"
            bind:value={newAccount.password}
            class="form-input"
            class:error={errors.password}
          />
          {#if errors.password}
            <span class="error-message">{errors.password}</span>
          {/if}
        </div>

        <div class="form-group">
          <label for="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            bind:value={newAccount.confirmPassword}
            class="form-input"
            class:error={errors.confirmPassword}
          />
          {#if errors.confirmPassword}
            <span class="error-message">{errors.confirmPassword}</span>
          {/if}
        </div>

        <div class="modal-actions">
          <button
            type="button"
            class="btn-secondary"
            on:click={() => (showCreateModal = false)}
          >
            Cancel
          </button>
          <button type="submit" class="btn-primary"> Create Account </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style lang="postcss">
  .btn-primary {
    @apply bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg transition-colors duration-200;
  }

  .btn-secondary {
    @apply bg-secondary hover:bg-secondary/80 text-white px-4 py-2 rounded-lg transition-colors duration-200;
  }

  .btn-icon {
    @apply text-secondary hover:text-primary px-2 py-1 rounded transition-colors duration-200;
  }

  .btn-icon-danger {
    @apply text-red-500 hover:text-red-700 px-2 py-1 rounded transition-colors duration-200;
  }

  .tab-button {
    @apply px-4 py-2 rounded-lg transition-colors duration-200;
    &.active {
      @apply bg-primary text-white;
    }
    &:not(.active) {
      @apply bg-muted text-secondary hover:bg-muted/80;
    }
  }

  .filters-container {
    @apply flex gap-4 mb-6 flex-wrap;
  }

  .filter-input {
    @apply bg-input rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary;
  }

  .filter-select {
    @apply bg-input rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary;
  }

  .table-header {
    @apply px-4 py-2 text-left bg-muted text-secondary font-medium;
  }

  .table-cell {
    @apply px-4 py-2 border-b border-border;
  }

  .table-row {
    @apply hover:bg-muted/50 transition-colors duration-200;
  }

  .badge-active {
    @apply bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm;
  }

  .badge-completed {
    @apply bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm;
  }

  .badge-status {
    @apply bg-primary/20 text-primary px-2 py-1 rounded-full text-sm;
  }

  .modal-overlay {
    @apply fixed inset-0 bg-black/50 flex items-center justify-center z-50;
  }

  .modal-container {
    @apply bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl;
  }

  .modal-title {
    @apply text-xl font-bold text-foreground mb-6;
  }

  .modal-form {
    @apply space-y-4;
  }

  .modal-actions {
    @apply flex justify-end gap-4 mt-6 pt-4 border-t border-border;
  }

  .form-group {
    @apply space-y-1;
  }

  .form-group label {
    @apply block text-sm font-medium text-secondary;
  }

  .form-input {
    @apply w-full bg-input rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary transition-shadow duration-200;
    &.error {
      @apply ring-2 ring-red-500 bg-red-50;
    }
  }

  .error-message {
    @apply text-sm text-red-500 mt-1;
  }

  .loading-spinner {
    @apply w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto my-8;
  }

  /* Responsive adjustments */
  @media (max-width: 640px) {
    .filters-container {
      @apply flex-col;
    }

    .filter-input,
    .filter-select {
      @apply w-full;
    }

    .table-cell {
      @apply px-2 py-1 text-sm;
    }

    .badge-active,
    .badge-completed,
    .badge-status {
      @apply text-xs px-1.5;
    }

    .btn-primary,
    .btn-secondary {
      @apply text-sm px-3 py-1.5;
    }

    .modal-container {
      @apply p-4;
    }

    .modal-title {
      @apply text-lg mb-4;
    }

    .modal-actions {
      @apply mt-4 pt-3;
    }
  }

  /* Animation classes */
  .animate-fade-in {
    @apply opacity-0 animate-[fadeIn_0.2s_ease-in-out_forwards];
  }

  .animate-slide-up {
    @apply translate-y-4 animate-[slideUp_0.3s_ease-out_forwards];
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slideUp {
    from {
      transform: translateY(1rem);
    }
    to {
      transform: translateY(0);
    }
  }

  /* Hover effects */
  .hover-scale {
    @apply hover:scale-105 transition-transform duration-200;
  }

  /* Focus styles */
  .focus-ring {
    @apply focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2;
  }

  /* Toast notification styles */
  .toast {
    @apply fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-md;
    &.success {
      @apply bg-green-50 border-l-4 border-green-500;
    }
    &.error {
      @apply bg-red-50 border-l-4 border-red-500;
    }
  }

  /* Print styles */
  @media print {
    .btn-primary,
    .btn-secondary,
    .filters-container,
    .modal-overlay {
      @apply hidden;
    }

    .table-cell,
    .table-header {
      @apply text-black border;
    }
  }
</style>
