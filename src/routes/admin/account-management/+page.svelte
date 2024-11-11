<script>
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabaseClient";
  import { fade, slide } from "svelte/transition";

  // Get data from server load function
  export let data;

  // Constants
  const EMAIL_DOMAIN = "@scg.shop";

  // Initialize accounts from server data with $:
  $: accounts = data.accounts || [];
  $: employees = accounts.filter((account) => account.role === "employee");
  $: admins = accounts.filter((account) =>
    ["admin", "superadmin"].includes(account.role)
  );

  // Reactive states
  let loading = false;
  let activeTab = "employees";
  let showCreateModal = false;
  let searchQuery = "";
  let sortBy = { field: "created_at", order: "desc" };

  // Form states
  let newAccount = {
    firstName: "",
    lastName: "",
    username: "",
    password: "",
    confirmPassword: "",
    role: "employee",
    position: "",
  };

  // Error states
  let errors = {};

  // Add new reactive states for UI
  let showDeleteModal = false;
  let selectedAccount = null;
  let showToast = false;
  let toastMessage = "";
  let toastType = "success";

  // Modified for role-based access
  $: canCreateAdmin = data.userRole === "superadmin";

  // Add edit state
  let editingAccount = null;
  let showEditModal = false;

  // Remove email from editForm since it's in auth.users
  let editForm = {
    id: "",
    firstName: "",
    lastName: "",
    contactNumber: "",
    address: "",
    position: "",
    role: "",
  };

  function openEditModal(account) {
    editForm = {
      id: account.id,
      firstName: account.first_name,
      lastName: account.last_name,
      contactNumber: account.contact_number || "",
      address: account.address || "",
      position: account.position || "",
      role: account.role,
    };
    editingAccount = account;
    showEditModal = true;
  }

  async function handleEditSubmit() {
    const formData = new FormData();
    Object.entries(editForm).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const result = await fetch("?/updateAccount", {
      method: "POST",
      body: formData,
    });

    if (result.ok) {
      showEditModal = false;
      editingAccount = null;
      window.location.reload(); // Refresh to show updated data
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
      position: "", // tailoring position
    };
    errors = {};
  }

  // Sort function
  function handleSort(field) {
    if (sortBy.field === field) {
      sortBy.order = sortBy.order === "asc" ? "desc" : "asc";
    } else {
      sortBy = { field, order: "asc" };
    }
  }

  $: filteredAccounts = (activeTab === "employees" ? employees : admins)
    .filter((account) => {
      if (!searchQuery) return true;
      const search = searchQuery.toLowerCase().trim();
      return (
        account.first_name?.toLowerCase().includes(search) ||
        account.last_name?.toLowerCase().includes(search) ||
        account.email?.toLowerCase().includes(search) ||
        account.contact_number?.toLowerCase().includes(search) ||
        account.position?.toLowerCase().includes(search) ||
        account.role?.toLowerCase().includes(search)
      );
    })
    .sort((a, b) => {
      const modifier = sortBy.order === "asc" ? 1 : -1;
      if (sortBy.field === "name") {
        return (
          (a.first_name + " " + a.last_name).localeCompare(
            b.first_name + " " + b.last_name
          ) * modifier
        );
      }
      if (sortBy.field === "created_at") {
        return (new Date(a.created_at) - new Date(b.created_at)) * modifier;
      }
      return (a[sortBy.field] > b[sortBy.field] ? 1 : -1) * modifier;
    });

  // Add this function
  function showDetailsModal(account) {
    selectedAccount = account;
  }
</script>

<div class="min-h-screen bg-gray-50/50">
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div
      class="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Account Management</h1>
        <p class="mt-2 text-sm text-gray-600">
          Manage employee and administrator accounts
        </p>
      </div>
      <button
        on:click={() => (showCreateModal = true)}
        class="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg shadow transition-colors duration-200 focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        <svg
          class="w-5 h-5 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
        Create New Account
      </button>
    </div>

    <!-- Tabs -->
    <div class="mb-6 bg-white rounded-lg p-1 inline-flex shadow-sm">
      <button
        class="px-4 py-2 rounded-md transition-all duration-200 {activeTab ===
        'employees'
          ? 'bg-primary text-white shadow-sm'
          : 'text-gray-600 hover:text-primary'}"
        on:click={() => (activeTab = "employees")}
      >
        Employees
      </button>
      <button
        class="px-4 py-2 rounded-md transition-all duration-200 {activeTab ===
        'admins'
          ? 'bg-primary text-white shadow-sm'
          : 'text-gray-600 hover:text-primary'}"
        on:click={() => (activeTab = "admins")}
      >
        Administrators
      </button>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="relative">
          <input
            type="text"
            placeholder="Search by name, email, role..."
            bind:value={searchQuery}
            class="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <svg
            class="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {#if searchQuery}
            <button
              class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              on:click={() => (searchQuery = "")}
            >
              <svg class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 111.414 1.414L11.414 10l4.293 4.293a1 1 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 01-1.414-1.414L8.586 10 4.293 5.707a1 1 010-1.414z"
                />
              </svg>
            </button>
          {/if}
        </div>
        <!-- ...other filters... -->
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-lg shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-200">
              <th
                class="px-6 py-3 text-left cursor-pointer hover:bg-gray-100 transition-colors"
                on:click={() => handleSort("name")}
              >
                <div class="flex items-center space-x-1">
                  <span class="text-xs font-medium text-gray-500 uppercase"
                    >Name</span
                  >
                  {#if sortBy.field === "name"}
                    <svg
                      class="w-4 h-4 text-gray-500 {sortBy.order === 'desc'
                        ? 'transform rotate-180'
                        : ''}"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M5 15l7-7 7 7"
                      />
                    </svg>
                  {/if}
                </div>
              </th>
              <th class="px-6 py-3 text-left">Email</th>
              <th class="px-6 py-3 text-left">Role</th>
              <th class="px-6 py-3 text-left">Position</th>
              <th
                class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase"
                >Actions</th
              >
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            {#each filteredAccounts as account (account.id)}
              <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4">
                  <div class="flex items-center">
                    <div
                      class="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium"
                    >
                      {account.first_name[0]}{account.last_name[0]}
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">
                        {account.first_name}
                        {account.last_name}
                      </div>
                      <div class="text-sm text-gray-500">
                        {account.contact_number || "No contact"}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-500">
                  {account.email}
                </td>
                <td class="px-6 py-4">
                  <span
                    class="px-2 py-1 rounded-full text-sm {account.role ===
                    'superadmin'
                      ? 'bg-purple-100 text-purple-800'
                      : account.role === 'admin'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'}"
                  >
                    {account.role === "superadmin"
                      ? "Super Admin"
                      : account.role === "admin"
                        ? "Admin"
                        : "Employee"}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-500"
                  >{account.position || "Not assigned"}</td
                >
                <td class="px-6 py-4 text-right space-x-2">
                  <button
                    class="text-primary hover:text-primary-dark font-medium text-sm"
                    on:click={() => showDetailsModal(account)}
                  >
                    Details
                  </button>
                  <button
                    class="text-primary hover:text-primary-dark font-medium text-sm"
                    on:click={() => openEditModal(account)}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Details Modal -->
    {#if selectedAccount}
      <div
        class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
        transition:fade
      >
        <div
          class="bg-white rounded-2xl shadow-2xl max-w-3xl w-full"
          transition:slide
        >
          <!-- Header with gradient background -->
          <div
            class="px-8 py-6 bg-gradient-to-r from-primary/90 to-primary-dark/90 rounded-t-2xl"
          >
            <div class="flex justify-between items-center">
              <div class="flex items-center space-x-4">
                <div
                  class="h-20 w-20 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-white text-2xl font-semibold shadow-lg border border-white/20"
                >
                  {selectedAccount.first_name[0]}{selectedAccount.last_name[0]}
                </div>
                <div class="text-white">
                  <h3 class="text-2xl font-bold tracking-tight">
                    {selectedAccount.first_name}
                    {selectedAccount.last_name}
                  </h3>
                  <p class="text-white/80">{selectedAccount.email}</p>
                </div>
              </div>
              <button
                on:click={() => (selectedAccount = null)}
                class="p-2 hover:bg-white/10 rounded-full transition-colors duration-200"
              >
                <svg
                  class="w-6 h-6 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          <!-- Content -->
          <div class="p-8">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <!-- Left Column -->
              <div class="space-y-6">
                <div
                  class="bg-gray-50 rounded-xl p-6 border border-gray-100 shadow-sm"
                >
                  <h4 class="text-lg font-semibold text-gray-900 mb-4">
                    Account Information
                  </h4>
                  <div class="space-y-4">
                    <div>
                      <span class="text-sm font-medium text-gray-500">Role</span
                      >
                      <div class="mt-2">
                        <span
                          class="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium {selectedAccount.role ===
                          'superadmin'
                            ? 'bg-purple-100 text-purple-800'
                            : selectedAccount.role === 'admin'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'}"
                        >
                          <span
                            class="w-2 h-2 rounded-full mr-2 {selectedAccount.role ===
                            'superadmin'
                              ? 'bg-purple-400'
                              : selectedAccount.role === 'admin'
                                ? 'bg-blue-400'
                                : 'bg-green-400'}"
                          ></span>
                          {selectedAccount.role === "superadmin"
                            ? "Super Administrator"
                            : selectedAccount.role === "admin"
                              ? "Administrator"
                              : "Employee"}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span class="text-sm font-medium text-gray-500"
                        >Position</span
                      >
                      <p class="mt-2 text-gray-900 font-medium">
                        {selectedAccount.position || "Not assigned"}
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  class="bg-gray-50 rounded-xl p-6 border border-gray-100 shadow-sm"
                >
                  <h4 class="text-lg font-semibold text-gray-900 mb-4">
                    Activity
                  </h4>
                  <div class="space-y-4">
                    <div class="flex items-center space-x-3">
                      <div class="flex-shrink-0">
                        <svg
                          class="w-5 h-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p class="text-sm font-medium text-gray-900">
                          Account Created
                        </p>
                        <p class="text-sm text-gray-500">
                          {new Date(
                            selectedAccount.created_at
                          ).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <div class="flex items-center space-x-3">
                      <div class="flex-shrink-0">
                        <svg
                          class="w-5 h-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p class="text-sm font-medium text-gray-900">
                          Last Sign In
                        </p>
                        <p class="text-sm text-gray-500">
                          {selectedAccount.lastSignIn
                            ? new Date(
                                selectedAccount.lastSignIn
                              ).toLocaleString("en-US", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })
                            : "Never signed in"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Right Column -->
              <div
                class="bg-gray-50 rounded-xl p-6 border border-gray-100 shadow-sm"
              >
                <h4 class="text-lg font-semibold text-gray-900 mb-4">
                  Contact Details
                </h4>
                <div class="space-y-6">
                  <div>
                    <div class="flex items-center space-x-3 mb-2">
                      <svg
                        class="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                      <span class="text-sm font-medium text-gray-900"
                        >Contact Number</span
                      >
                    </div>
                    <p class="text-gray-600 ml-8">
                      {selectedAccount.contact_number || "Not provided"}
                    </p>
                  </div>

                  <div>
                    <div class="flex items-center space-x-3 mb-2">
                      <svg
                        class="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span class="text-sm font-medium text-gray-900"
                        >Address</span
                      >
                    </div>
                    <p class="text-gray-600 ml-8">
                      {selectedAccount.address || "Not provided"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <!-- Modals -->
  {#if showCreateModal}
    <div
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      transition:fade
    >
      <div
        class="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col"
        transition:slide
      >
        <!-- Header -->
        <div
          class="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0"
        >
          <h3 class="text-xl font-semibold text-gray-900">
            Create New Account
          </h3>
          <button
            on:click={() => (showCreateModal = false)}
            class="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <svg
              class="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <!-- Scrollable Content -->
        <div class="overflow-y-auto flex-1 p-6">
          <form on:submit|preventDefault={createAccount} class="space-y-8">
            <!-- Two-column layout -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <!-- Basic Information -->
              <div class="space-y-6">
                <div class="bg-gray-50 p-4 rounded-lg">
                  <h4 class="text-sm font-medium text-gray-900 uppercase mb-4">
                    Basic Information
                  </h4>
                  <div class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          for="firstName"
                          class="block text-sm font-medium text-gray-700 mb-1"
                          >First Name</label
                        >
                        <input
                          type="text"
                          id="firstName"
                          bind:value={newAccount.firstName}
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent {errors.firstName
                            ? 'border-error'
                            : ''}"
                        />
                        {#if errors.firstName}
                          <p class="mt-1 text-sm text-error">
                            {errors.firstName}
                          </p>
                        {/if}
                      </div>
                      <div>
                        <label
                          for="lastName"
                          class="block text-sm font-medium text-gray-700 mb-1"
                          >Last Name</label
                        >
                        <input
                          type="text"
                          id="lastName"
                          bind:value={newAccount.lastName}
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent {errors.lastName
                            ? 'border-error'
                            : ''}"
                        />
                        {#if errors.lastName}
                          <p class="mt-1 text-sm text-error">
                            {errors.lastName}
                          </p>
                        {/if}
                      </div>
                    </div>

                    <div>
                      <label
                        for="role"
                        class="block text-sm font-medium text-gray-700 mb-1"
                        >Account Role</label
                      >
                      {#if canCreateAdmin}
                        <select
                          id="role"
                          bind:value={newAccount.role}
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                        >
                          <option value="employee">Tailor</option>
                          <option value="admin">Administrator</option>
                        </select>
                      {:else}
                        <input
                          type="text"
                          value="Tailor"
                          disabled
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                        />
                        <input type="hidden" bind:value={newAccount.role} />
                      {/if}
                    </div>

                    <div>
                      <label
                        for="position"
                        class="block text-sm font-medium text-gray-700 mb-1"
                        >Position</label
                      >
                      <input
                        type="text"
                        id="position"
                        bind:value={newAccount.position}
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Enter position"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Account Credentials -->
              <div class="space-y-6">
                <div class="bg-gray-50 p-4 rounded-lg">
                  <h4 class="text-sm font-medium text-gray-900 uppercase mb-4">
                    Account Credentials
                  </h4>
                  <div class="space-y-4">
                    <div>
                      <label
                        for="username"
                        class="block text-sm font-medium text-gray-700 mb-1"
                        >Username</label
                      >
                      <div class="relative">
                        <input
                          type="text"
                          id="username"
                          bind:value={newAccount.username}
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent pr-24 {errors.username
                            ? 'border-error'
                            : ''}"
                        />
                        <span
                          class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm"
                          >{EMAIL_DOMAIN}</span
                        >
                      </div>
                      {#if errors.username}
                        <p class="mt-1 text-sm text-error">{errors.username}</p>
                      {/if}
                    </div>

                    <div>
                      <label
                        for="password"
                        class="block text-sm font-medium text-gray-700 mb-1"
                        >Password</label
                      >
                      <input
                        type="password"
                        id="password"
                        bind:value={newAccount.password}
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent {errors.password
                          ? 'border-error'
                          : ''}"
                      />
                      {#if errors.password}
                        <p class="mt-1 text-sm text-error">{errors.password}</p>
                      {/if}
                    </div>

                    <div>
                      <label
                        for="confirmPassword"
                        class="block text-sm font-medium text-gray-700 mb-1"
                        >Confirm Password</label
                      >
                      <input
                        type="password"
                        id="confirmPassword"
                        bind:value={newAccount.confirmPassword}
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent {errors.confirmPassword
                          ? 'border-error'
                          : ''}"
                      />
                      {#if errors.confirmPassword}
                        <p class="mt-1 text-sm text-error">
                          {errors.confirmPassword}
                        </p>
                      {/if}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        <!-- Footer -->
        <div
          class="px-6 py-4 border-t border-gray-200 flex justify-end gap-4 flex-shrink-0 bg-white"
        >
          <button
            type="button"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            on:click={() => (showCreateModal = false)}
          >
            Cancel
          </button>
          <button
            type="submit"
            class="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Edit Modal with similar layout -->
  {#if showEditModal}
    <div
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      transition:fade
    >
      <div
        class="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col"
        transition:slide
      >
        <!-- Header -->
        <div
          class="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0"
        >
          <h3 class="text-xl font-semibold text-gray-900">Edit Account</h3>
          <button
            on:click={() => (showEditModal = false)}
            class="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <svg
              class="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <!-- Scrollable Content -->
        <div class="overflow-y-auto flex-1 p-6">
          <form on:submit|preventDefault={handleEditSubmit} class="space-y-8">
            <!-- Two-column layout -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <!-- Basic Information -->
              <div class="space-y-6">
                <div class="bg-gray-50 p-4 rounded-lg">
                  <h4 class="text-sm font-medium text-gray-900 uppercase mb-4">
                    Basic Information
                  </h4>
                  <div class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          for="edit-firstName"
                          class="block text-sm font-medium text-gray-700 mb-1"
                          >First Name</label
                        >
                        <input
                          type="text"
                          id="edit-firstName"
                          bind:value={editForm.firstName}
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label
                          for="edit-lastName"
                          class="block text-sm font-medium text-gray-700 mb-1"
                          >Last Name</label
                        >
                        <input
                          type="text"
                          id="edit-lastName"
                          bind:value={editForm.lastName}
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        for="edit-position"
                        class="block text-sm font-medium text-gray-700 mb-1"
                        >Position</label
                      >
                      <input
                        type="text"
                        id="edit-position"
                        bind:value={editForm.position}
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Enter position"
                        required
                      />
                    </div>

                    {#if data.userRole === "superadmin"}
                      <div>
                        <label
                          for="edit-role"
                          class="block text-sm font-medium text-gray-700 mb-1"
                          >Account Role</label
                        >
                        <select
                          id="edit-role"
                          bind:value={editForm.role}
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                        >
                          <option value="employee">Tailor</option>
                          <option value="admin">Administrator</option>
                          <option value="superadmin">Super Administrator</option
                          >
                        </select>
                      </div>
                    {/if}
                  </div>
                </div>
              </div>

              <!-- Contact Information -->
              <div class="space-y-6">
                <div class="bg-gray-50 p-4 rounded-lg">
                  <h4 class="text-sm font-medium text-gray-900 uppercase mb-4">
                    Contact Information
                  </h4>
                  <div class="space-y-4">
                    <div>
                      <label
                        for="edit-contact"
                        class="block text-sm font-medium text-gray-700 mb-1"
                        >Contact Number</label
                      >
                      <input
                        type="text"
                        id="edit-contact"
                        bind:value={editForm.contactNumber}
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label
                        for="edit-address"
                        class="block text-sm font-medium text-gray-700 mb-1"
                        >Address</label
                      >
                      <textarea
                        id="edit-address"
                        bind:value={editForm.address}
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                        rows="3"
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        <!-- Footer -->
        <div
          class="px-6 py-4 border-t border-gray-200 flex justify-end gap-4 flex-shrink-0 bg-white"
        >
          <button
            type="button"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            on:click={() => (showEditModal = false)}
          >
            Cancel
          </button>
          <button
            type="submit"
            class="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            on:click={handleEditSubmit}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Toast Notifications -->
  {#if showToast}
    <div
      class="fixed bottom-4 right-4 px-6 py-4 rounded-lg shadow-lg animate-slideDown flex items-center gap-2 {toastType ===
      'success'
        ? 'bg-success text-white'
        : 'bg-error text-white'}"
      transition:slide
    >
      {#if toastType === "success"}
        <svg
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 13l4 4L19 7"
          />
        </svg>
      {:else}
        <svg
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      {/if}
      {toastMessage}
    </div>
  {/if}
</div>
