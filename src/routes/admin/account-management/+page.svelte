<script>
  import { page } from "$app/stores";
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
  $: activeTab = $page.url.searchParams.get("tab") || "employees";
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
    contactNumber: "",
    address: "",
  };

  // Error states
  let errors = {};

  // Add new reactive states for UI
  let showDeleteModal = false;
  let selectedAccount = null;
  let showToast = false;
  let toastMessage = "";
  let toastType = "success";
  let showDetailsModal = false; // Add this line near other modal states

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
    username: "",
    password: "",
    confirmPassword: "",
  };

  // Add 'editErrors' object for validation
  let editErrors = {};

  // Add states for password visibility
  let showPassword = false;
  let showConfirmPassword = false;
  let showEditPassword = false;
  let showEditConfirmPassword = false;

  function openEditModal(account) {
    editForm = {
      id: account.id,
      firstName: account.first_name,
      lastName: account.last_name,
      contactNumber: account.contact_number || "",
      address: account.address || "",
      position: account.position || "",
      role: account.role,
      username: account.email.split("@")[0], // Extract username from email
      password: "",
      confirmPassword: "",
    };
    editingAccount = account;
    showEditModal = true;
  }

  async function handleEditSubmit() {
    if (!validateEditForm()) return;

    // Convert names and address to sentence case
    editForm.firstName = toSentenceCase(editForm.firstName);
    editForm.lastName = toSentenceCase(editForm.lastName);
    editForm.position = toSentenceCase(editForm.position);
    editForm.address = toSentenceCase(editForm.address);

    // Reset errors
    editErrors = {};

    // Validate form fields
    if (!editForm.firstName) {
      editErrors.firstName = "First name is required";
    }
    if (!editForm.lastName) {
      editErrors.lastName = "Last name is required";
    }
    if (editForm.password && editForm.password !== editForm.confirmPassword) {
      editErrors.password = "Passwords do not match";
    }

    // If there are validation errors, stop submission
    if (Object.keys(editErrors).length > 0) {
      return;
    }

    const formData = new FormData();
    Object.entries(editForm).forEach(([key, value]) => {
      formData.append(key, value);
    });

    if (editForm.password && editForm.password === editForm.confirmPassword) {
      formData.append("password", editForm.password);
    }

    const result = await fetch("?/updateAccount", {
      method: "POST",
      body: formData,
    });

    if (result.ok) {
      showEditModal = false;
      editingAccount = null;
      location.reload(); // Refresh to show updated data
    }
  }

  async function createAccount() {
    if (!validateForm()) return;

    // Convert names and address to sentence case
    newAccount.firstName = toSentenceCase(newAccount.firstName);
    newAccount.lastName = toSentenceCase(newAccount.lastName);
    newAccount.position = toSentenceCase(newAccount.position);
    newAccount.address = toSentenceCase(newAccount.address);

    loading = true;
    try {
      const email = `${newAccount.username.toLowerCase()}${EMAIL_DOMAIN}`;

      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", newAccount.password);
      formData.append("firstName", newAccount.firstName);
      formData.append("lastName", newAccount.lastName);
      formData.append("role", newAccount.role);
      formData.append("position", newAccount.position);
      formData.append("contactNumber", newAccount.contactNumber);
      formData.append("address", newAccount.address);

      const response = await fetch("?/createAccount", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      showCreateModal = false;
      toastMessage = "Account created successfully";
      toastType = "success";
      showToast = true;
      setTimeout(() => (showToast = false), 3000);
      location.reload();
    } catch (error) {
      console.error("Error creating account:", error);
      toastMessage = error.message || "Failed to create account";
      toastType = "error";
      showToast = true;
      setTimeout(() => (showToast = false), 3000);
    } finally {
      loading = false;
    }
  }

  function validateForm() {
    errors = {};

    // Name validations
    const firstNameError = validateName(newAccount.firstName);
    if (firstNameError) errors.firstName = firstNameError;

    const lastNameError = validateName(newAccount.lastName);
    if (lastNameError) errors.lastName = lastNameError;

    // Position validation
    const positionError = validatePosition(newAccount.position);
    if (positionError) errors.position = positionError;

    // Contact number validation
    const phoneError = validatePhoneNumber(newAccount.contactNumber);
    if (phoneError) errors.contactNumber = phoneError;

    // Address validation
    const addressError = validateAddress(newAccount.address);
    if (addressError) errors.address = addressError;

    // Existing username and password validations
    if (!newAccount.firstName) errors.firstName = "First name is required";
    if (!newAccount.lastName) errors.lastName = "Last name is required";
    if (!newAccount.username) errors.username = "Username is required";
    if (!newAccount.password) errors.password = "Password is required";

    // Username validation
    const usernameError = validateUsername(newAccount.username);
    if (usernameError) errors.username = usernameError;

    if (newAccount.password !== newAccount.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
    if (newAccount.password && newAccount.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }

    return Object.keys(errors).length === 0;
  }

  function validateEditForm() {
    editErrors = {};

    const firstNameError = validateName(editForm.firstName);
    if (firstNameError) editErrors.firstName = firstNameError;

    const lastNameError = validateName(editForm.lastName);
    if (lastNameError) editErrors.lastName = lastNameError;

    const positionError = validatePosition(editForm.position);
    if (positionError) editErrors.position = positionError;

    const phoneError = validatePhoneNumber(editForm.contactNumber);
    if (phoneError) editErrors.contactNumber = phoneError;

    const addressError = validateAddress(editForm.address);
    if (addressError) editErrors.address = addressError;

    // Password validation only if password is provided
    if (editForm.password) {
      // ...existing password validation...
    }

    return Object.keys(editErrors).length === 0;
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
      if (sortBy.field === "email") {
        return (a.email || "").localeCompare(b.email || "") * modifier;
      }
      if (sortBy.field === "role") {
        return (a.role || "").localeCompare(b.role || "") * modifier;
      }
      if (sortBy.field === "position") {
        return (a.position || "").localeCompare(b.position || "") * modifier;
      }
      if (sortBy.field === "created_at") {
        return (new Date(a.created_at) - new Date(b.created_at)) * modifier;
      }
      return (a[sortBy.field] > b[sortBy.field] ? 1 : -1) * modifier;
    });

  async function handleDeleteAccount() {
    if (!selectedAccount) return;

    const formData = new FormData();
    formData.append("userId", selectedAccount.id);

    try {
      const response = await fetch("?/deleteAccount", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      showDeleteModal = false;
      selectedAccount = null;
      toastMessage = "Account deleted successfully";
      toastType = "success";
      showToast = true;
      setTimeout(() => (showToast = false), 3000);
      location.reload();
    } catch (error) {
      console.error("Error deleting account:", error);
      toastMessage = error.message || "Failed to delete account";
      toastType = "error";
      showToast = true;
      setTimeout(() => (showToast = false), 3000);
    }
  }

  function validateName(name) {
    if (!name) return "This field is required";
    name = name.trim().replace(/\s+/g, " "); // Remove extra spaces
    if (name.length < 2 || name.length > 50)
      return "Must be between 2-50 characters";
    if (!/^[a-zA-Z\s.]+$/.test(name))
      return "Only letters, spaces, and dots allowed";
    return null;
  }

  function validatePhoneNumber(phone) {
    if (!phone) return "Contact number is required";
    phone = phone.trim();
    if (!/^09\d{9}$/.test(phone)) return "Must be 11 digits starting with 09";
    return null;
  }

  function validateAddress(address) {
    if (!address) return "Address is required";
    address = address.trim().replace(/\s+/g, " "); // Remove extra spaces
    if (address.length < 5 || address.length > 200)
      return "Must be between 5-200 characters";
    if (!/^[a-zA-Z0-9\s,.\-#]+$/.test(address))
      return "Only letters, numbers, spaces, commas, dots, hyphens, and #";
    return null;
  }

  function validatePosition(position) {
    if (!position) return "Position is required";
    position = position.trim().replace(/\s+/g, " "); // Remove extra spaces
    if (position.length < 2 || position.length > 50)
      return "Must be between 2-50 characters";
    if (!/^[a-zA-Z\s\-]+$/.test(position))
      return "Only letters, spaces, and hyphens allowed";
    return null;
  }

  function validateUsername(username) {
    if (!username) return "Username is required";

    // Only allow letters, numbers, and dots
    if (!/^[a-zA-Z0-9.]+$/.test(username)) {
      return "Username can only contain letters, numbers, and dots";
    }

    // Check if username already exists
    const email = `${username.toLowerCase()}${EMAIL_DOMAIN}`;
    if (data.existingEmails.includes(email)) {
      return "This username is already taken";
    }

    // Username length validation - MODIFIED HERE
    if (username.length < 2 || username.length > 30) {
      return "Username must be between 2 and 30 characters";
    }

    // Don't allow username to start or end with dot
    if (username.startsWith(".") || username.endsWith(".")) {
      return "Username cannot start or end with a dot";
    }

    // Don't allow consecutive dots
    if (username.includes("..")) {
      return "Username cannot contain consecutive dots";
    }

    return null;
  }

  function toSentenceCase(text) {
    return text
      .trim()
      .replace(/\s+/g, " ") // Remove extra spaces
      .toLowerCase()
      .replace(/(?:^|\s)\w/g, (letter) => letter.toUpperCase());
  }
</script>

<div class="min-h-screen bg-gray-50/50">
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div
      class="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <!-- Header Section -->
  <div class="flex justify-between items-center">
    <div class="flex items-center gap-4">
      <div class="bg-primary/10 p-3 rounded-lg">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-6 h-6 text-primary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
        <path fill="currentColor" d="M11 10v2H9v2H7v-2H5.8c-.4 1.2-1.5 2-2.8 2c-1.7 0-3-1.3-3-3s1.3-3 3-3c1.3 0 2.4.8 2.8 2zm-8 0c-.6 0-1 .4-1 1s.4 1 1 1s1-.4 1-1s-.4-1-1-1m13 4c2.7 0 8 1.3 8 4v2H8v-2c0-2.7 5.3-4 8-4m0-2c-2.2 0-4-1.8-4-4s1.8-4 4-4s4 1.8 4 4s-1.8 4-4 4" />
        </svg>
      </div>
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Account Management</h1>
        <p class="text-sm text-gray-500">
            Manage and maintain accounts
        </p>
      </div>
    </div>
  </div>
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
        on:click={() => {
          activeTab = "employees";
          const url = new URL(window.location);
          url.searchParams.set("tab", "employees");
          window.history.pushState({}, "", url);
        }}
      >
        Tailor
      </button>
      <button
        class="px-4 py-2 rounded-md transition-all duration-200 {activeTab ===
        'admins'
          ? 'bg-primary text-white shadow-sm'
          : 'text-gray-600 hover:text-primary'}"
        on:click={() => {
          activeTab = "admins";
          const url = new URL(window.location);
          url.searchParams.set("tab", "admins");
          window.history.pushState({}, "", url);
        }}
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
              x
            </button>
          {/if}
        </div>
        <!-- ...other filters... -->
      </div>
    </div>

    <!-- Main content card -->
    <div class="bg-white p-6 rounded-lg shadow-md">
      <div class="flex flex-col md:flex-row justify-between gap-4 md:gap-0 mb-4">
        <h2 class="text-xl font-semibold">Accounts List</h2>
        <input
          type="text"
          placeholder="Search accounts..."
          bind:value={searchQuery}
          class="w-full md:w-auto border rounded p-2"
        />
      </div>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-muted max-md:whitespace-nowrap">
              <th
                class="p-2 cursor-pointer hover:bg-gray-200 text-left"
                on:click={() => handleSort("name")}
              >
                Name
                {#if sortBy.field === "name"}
                  <span class="ml-1">{sortBy.order === "asc" ? "↑" : "↓"}</span>
                {/if}
              </th>
              <th
                class="p-2 cursor-pointer hover:bg-gray-200 text-left"
                on:click={() => handleSort("email")}
              >
                Email
                {#if sortBy.field === "email"}
                  <span class="ml-1">{sortBy.order === "asc" ? "↑" : "↓"}</span>
                {/if}
              </th>
              <th
                class="p-2 cursor-pointer hover:bg-gray-200 text-left"
                on:click={() => handleSort("role")}
              >
                Role
                {#if sortBy.field === "role"}
                  <span class="ml-1">{sortBy.order === "asc" ? "↑" : "↓"}</span>
                {/if}
              </th>
              <th
                class="p-2 cursor-pointer hover:bg-gray-200 text-left"
                on:click={() => handleSort("position")}
              >
                Position
                {#if sortBy.field === "position"}
                  <span class="ml-1">{sortBy.order === "asc" ? "↑" : "↓"}</span>
                {/if}
              </th>
              <th
                class="p-2 cursor-pointer hover:bg-gray-200 text-left"
                on:click={() => handleSort("created_at")}
              >
                Created At
                {#if sortBy.field === "created_at"}
                  <span class="ml-1">{sortBy.order === "asc" ? "↑" : "↓"}</span>
                {/if}
              </th>
              <th class="p-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each filteredAccounts as account (account.id)}
              <tr class="border-b hover:bg-muted">
                <td class="p-2">
                  <div class="flex items-center">
                    <div
                      class="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm"
                    >
                      {account.first_name[0]}{account.last_name[0]}
                    </div>
                    <span class="ml-2">
                      {account.first_name} {account.last_name}
                    </span>
                  </div>
                </td>
                <td class="p-2">{account.email}</td>
                <td class="p-2">
                  <span
                    class="px-2 py-1 rounded-full text-sm {account.role === 'superadmin'
                      ? 'bg-purple-100 text-purple-800'
                      : account.role === 'admin'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'}"
                  >
                    {account.role === "superadmin"
                      ? "Super Admin"
                      : account.role === "admin"
                        ? "Admin"
                        : "Tailor"}
                  </span>
                </td>
                <td class="p-2">{account.position || "-"}</td>
                <td class="p-2">
                  {new Date(account.created_at).toLocaleDateString()}
                </td>
                <td class="p-2 text-right">
                  <button
                    class="text-blue-600 hover:text-blue-800 mr-2"
                    on:click={() => {
                      showDeleteModal = false;
                      showDetailsModal = true;
                      selectedAccount = account;
                    }}
                  >
                    Details
                  </button>
                  {#if account.role !== 'superadmin'}
                    <button
                      class="text-blue-600 hover:text-blue-800 mr-2"
                      on:click={() => {
                        showDeleteModal = false;
                        showDetailsModal = false;
                        openEditModal(account);
                      }}
                    >
                      Edit
                    </button>
                    {#if data.userRole === "superadmin" || (data.userRole === "admin" && account.role === "employee")}
                      <button
                        class="text-red-600 hover:text-red-800"
                        on:click={() => {
                          selectedAccount = account;
                          showDeleteModal = true;
                          showDetailsModal = false;
                        }}
                      >
                        Delete
                      </button>
                    {/if}
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Details Modal -->
    {#if showDetailsModal && selectedAccount}
      <div
        class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
        transition:fade
      >
        <div
          class="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-md:h-[90vh] overflow-y-auto"
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
                on:click={() => {
                  showDetailsModal = false;
                  selectedAccount = null;
                }}
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
                              : "Tailor"}
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
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.502 4.257A2 2 0 0 0 7.646 3H4.895A1.895 1.895 0 0 0 3 4.895C3 13.789 10.21 21 19.106 21A1.895 1.895 0 0 0 21 19.105v-2.751a2 2 0 0 0-1.257-1.857l-2.636-1.054a2 2 0 0 0-2.023.32l-.68.568a2 2 0 0 1-2.696-.122L9.792 12.29a2 2 0 0 1-.123-2.694l.567-.68a2 2 0 0 0 .322-2.024z"/></svg>
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
                          on:input={() =>
                            (errors.firstName = validateName(
                              newAccount.firstName
                            ))}
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
                          on:input={() =>
                            (errors.lastName = validateName(
                              newAccount.lastName
                            ))}
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
                        on:input={() =>
                          (errors.position = validatePosition(
                            newAccount.position
                          ))}
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent {errors.position
                          ? 'border-error'
                          : ''}"
                        placeholder="Enter position"
                        required
                      />
                      {#if errors.position}
                        <p class="mt-1 text-sm text-error">{errors.position}</p>
                      {/if}
                    </div>

                    <div>
                      <label
                        for="contactNumber"
                        class="block text-sm font-medium text-gray-700 mb-1"
                        >Contact Number</label
                      >
                      <input
                        type="text"
                        id="contactNumber"
                        bind:value={newAccount.contactNumber}
                        on:input={() =>
                          (errors.contactNumber = validatePhoneNumber(
                            newAccount.contactNumber
                          ))}
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent {errors.contactNumber
                          ? 'border-error'
                          : ''}"
                        placeholder="09XXXXXXXXX"
                      />
                      {#if errors.contactNumber}
                        <p class="mt-1 text-sm text-error">
                          {errors.contactNumber}
                        </p>
                      {/if}
                    </div>

                    <div>
                      <label
                        for="address"
                        class="block text-sm font-medium text-gray-700 mb-1"
                        >Address</label
                      >
                      <textarea
                        id="address"
                        bind:value={newAccount.address}
                        on:input={() =>
                          (errors.address = validateAddress(
                            newAccount.address
                          ))}
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent {errors.address
                          ? 'border-error'
                          : ''}"
                        rows="3"
                      ></textarea>
                      {#if errors.address}
                        <p class="mt-1 text-sm text-error">{errors.address}</p>
                      {/if}
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
                          on:input={() =>
                            (errors.username = validateUsername(
                              newAccount.username
                            ))}
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
                      <div class="relative">
                        {#if showPassword}
                          <input
                            type="text"
                            id="password"
                            bind:value={newAccount.password}
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent {errors.password
                              ? 'border-error'
                              : ''}"
                          />
                        {:else}
                          <input
                            type="password"
                            id="password"
                            bind:value={newAccount.password}
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent {errors.password
                              ? 'border-error'
                              : ''}"
                          />
                        {/if}
                        <button
                          type="button"
                          class="absolute inset-y-0 right-0 pr-3 flex items-center"
                          on:click={() => (showPassword = !showPassword)}
                        >
                          <svg
                            class="h-5 w-5 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            {#if !showPassword}
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                              />
                            {:else}
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            {/if}
                          </svg>
                        </button>
                      </div>
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
                      <div class="relative">
                        {#if showConfirmPassword}
                          <input
                            type="text"
                            id="confirmPassword"
                            bind:value={newAccount.confirmPassword}
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent {errors.confirmPassword
                              ? 'border-error'
                              : ''}"
                          />
                        {:else}
                          <input
                            type="password"
                            id="confirmPassword"
                            bind:value={newAccount.confirmPassword}
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent {errors.confirmPassword
                              ? 'border-error'
                              : ''}"
                          />
                        {/if}
                        <button
                          type="button"
                          class="absolute inset-y-0 right-0 pr-3 flex items-center"
                          on:click={() =>
                            (showConfirmPassword = !showConfirmPassword)}
                        >
                          <svg
                            class="h-5 w-5 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            {#if !showConfirmPassword}
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                              />
                            {:else}
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            {/if}
                          </svg>
                        </button>
                      </div>
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
            on:click={() => {
              showCreateModal = false;
              resetForm();
            }}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            on:click={createAccount}
            disabled={loading}
            class="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary flex items-center space-x-2"
          >
            {#if loading}
              <svg
                class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>Creating...</span>
            {:else}
              <span>Create Account</span>
            {/if}
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Edit Modal -->
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
                          on:input={() =>
                            (editErrors.firstName = validateName(
                              editForm.firstName
                            ))}
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent {editErrors.firstName
                            ? 'border-error'
                            : ''}"
                        />
                        {#if editErrors.firstName}
                          <p class="mt-1 text-sm text-error">
                            {editErrors.firstName}
                          </p>
                        {/if}
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
                          on:input={() =>
                            (editErrors.lastName = validateName(
                              editForm.lastName
                            ))}
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent {editErrors.lastName
                            ? 'border-error'
                            : ''}"
                        />
                        {#if editErrors.lastName}
                          <p class="mt-1 text-sm text-error">
                            {editErrors.lastName}
                          </p>
                        {/if}
                      </div>
                    </div>

                    <div>
                      <label
                        for="edit-role"
                        class="block text-sm font-medium text-gray-700 mb-1"
                        >Account Role</label
                      >
                      {#if data.userRole === "superadmin"}
                        <select
                          id="edit-role"
                          bind:value={editForm.role}
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
                        <input type="hidden" bind:value={editForm.role} />
                      {/if}
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
                        on:input={() =>
                          (editErrors.position = validatePosition(
                            editForm.position
                          ))}
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Enter position"
                      />
                    </div>

                    <div>
                      <label
                        for="edit-contactNumber"
                        class="block text-sm font-medium text-gray-700 mb-1"
                        >Contact Number</label
                      >
                      <input
                        type="text"
                        id="edit-contactNumber"
                        bind:value={editForm.contactNumber}
                        on:input={() =>
                          (editErrors.contactNumber = validatePhoneNumber(
                            editForm.contactNumber
                          ))}
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="+639..."
                      />
                      {#if editErrors.contactNumber}
                        <p class="mt-1 text-sm text-error">
                          {editErrors.contactNumber}
                        </p>
                      {/if}
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
                        on:input={() =>
                          (editErrors.address = validateAddress(
                            editForm.address
                          ))}
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent {editErrors.address
                          ? 'border-error'
                          : ''}"
                        rows="3"
                      ></textarea>
                      {#if editErrors.address}
                        <p class="mt-1 text-sm text-error">
                          {editErrors.address}
                        </p>
                      {/if}
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
                        for="edit-username"
                        class="block text-sm font-medium text-gray-700 mb-1"
                        >Username</label
                      >
                      <div class="relative">
                        <input
                          type="text"
                          id="edit-username"
                          bind:value={editForm.username}
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                          disabled
                        />
                        <span
                          class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm"
                          >{EMAIL_DOMAIN}</span
                        >
                      </div>
                    </div>

                    <div>
                      <label
                        for="edit-password"
                        class="block text-sm font-medium text-gray-700 mb-1"
                        >New Password</label
                      >
                      <div class="relative">
                        {#if showEditPassword}
                          <input
                            type="text"
                            id="edit-password"
                            bind:value={editForm.password}
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent {editErrors.password
                              ? 'border-error'
                              : ''}"
                          />
                        {:else}
                          <input
                            type="password"
                            id="edit-password"
                            bind:value={editForm.password}
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent {editErrors.password
                              ? 'border-error'
                              : ''}"
                          />
                        {/if}
                        <button
                          type="button"
                          class="absolute inset-y-0 right-0 pr-3 flex items-center"
                          on:click={() =>
                            (showEditPassword = !showEditPassword)}
                        >
                          <svg
                            class="h-5 w-5 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            {#if !showEditPassword}
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                              />
                            {:else}
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            {/if}
                          </svg>
                        </button>
                      </div>
                      {#if editErrors.password}
                        <p class="mt-1 text-sm text-error">
                          {editErrors.password}
                        </p>
                      {/if}
                    </div>

                    <div>
                      <label
                        for="edit-confirmPassword"
                        class="block text-sm font-medium text-gray-700 mb-1"
                        >Confirm New Password</label
                      >
                      <div class="relative">
                        {#if showEditConfirmPassword}
                          <input
                            type="text"
                            id="edit-confirmPassword"
                            bind:value={editForm.confirmPassword}
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent {editErrors.confirmPassword
                              ? 'border-error'
                              : ''}"
                          />
                        {:else}
                          <input
                            type="password"
                            id="edit-confirmPassword"
                            bind:value={editForm.confirmPassword}
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent {editErrors.confirmPassword
                              ? 'border-error'
                              : ''}"
                          />
                        {/if}
                        <button
                          type="button"
                          class="absolute inset-y-0 right-0 pr-3 flex items-center"
                          on:click={() =>
                            (showEditConfirmPassword =
                              !showEditConfirmPassword)}
                        >
                          <svg
                            class="h-5 w-5 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            {#if !showEditConfirmPassword}
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                              />
                            {:else}
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            {/if}
                          </svg>
                        </button>
                      </div>
                      {#if editErrors.confirmPassword}
                        <p class="mt-1 text-sm text-error">
                          {editErrors.confirmPassword}
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

  <!-- Delete Confirmation Modal -->
  {#if showDeleteModal}
    <div
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      transition:fade
    >
      <div
        class="bg-white rounded-xl shadow-xl w-full max-w-md p-6"
        transition:slide
      >
        <h3 class="text-xl font-semibold text-gray-900 mb-4">Confirm Delete</h3>
        <p class="text-gray-600 mb-6">
          Are you sure you want to delete the account for {selectedAccount?.first_name}
          {selectedAccount?.last_name}? This action cannot be undone.
        </p>
        <div class="flex justify-end gap-4">
          <button
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            on:click={() => {
              showDeleteModal = false;
              selectedAccount = null;
            }}
          >
            Cancel
          </button>
          <button
            class="px-4 py-2 text-sm font-medium text-white bg-error hover:bg-error-dark rounded-lg"
            on:click={handleDeleteAccount}
          >
            Delete Account
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
