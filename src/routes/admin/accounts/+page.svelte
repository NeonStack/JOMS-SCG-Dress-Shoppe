<script>
    import { enhance } from '$app/forms';
    import { scale, fade } from 'svelte/transition';
    export let data;

    let accounts = data.profiles;
    let searchTerm = '';
    let editingId = null;
    let showCreateModal = false;
    let showDeleteModal = false;
    let showDetailsModal = false;
    let showErrorModal = false;
    let errorMessage = '';
    let isLoading = false;
    let accountToDelete = null;
    let accountToView = null;
    let newAccount = {
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        role: 'employee',
        contact_number: '',
        address: '',
        position: ''
    };

    // Initialize sort state
    let sortState = {
        column: 'created_at',
        direction: 'desc'
    };

    // Updated toggle sort function
    const toggleSort = (column) => {
        if (sortState.column === column) {
            sortState = {
                ...sortState,
                direction: sortState.direction === 'asc' ? 'desc' : 'asc'
            };
        } else {
            sortState = {
                column: column,
                direction: 'asc'
            };
        }
    };

    // Updated filtered accounts with sorting
    $: filteredAccounts = accounts
        ?.filter(account => 
            account.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            account.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            account.role.toLowerCase().includes(searchTerm.toLowerCase())
        )
        ?.sort((a, b) => {
            const modifier = sortState.direction === 'asc' ? 1 : -1;
            switch (sortState.column) {
                case 'name':
                    return modifier * (`${a.first_name} ${a.last_name}`).localeCompare(`${b.first_name} ${b.last_name}`);
                case 'role':
                    return modifier * a.role.localeCompare(b.role);
                case 'position':
                    return modifier * ((a.position || '').localeCompare(b.position || ''));
                case 'created_at':
                    return modifier * (new Date(a.created_at) - new Date(b.created_at));
                default:
                    return 0;
            }
        });

    const resetForms = () => {
        editingId = null;
        newAccount = {
            email: '',
            password: '',
            first_name: '',
            last_name: '',
            role: 'employee',
            contact_number: '',
            address: '',
            position: ''
        };
        showCreateModal = false;
        showDeleteModal = false;
        showDetailsModal = false;
        showErrorModal = false;
        errorMessage = '';
        isLoading = false;
        accountToDelete = null;
        accountToView = null;
    };

    const showError = (message) => {
        errorMessage = message;
        showErrorModal = true;
        isLoading = false;
    };

    const handleCreateSubmit = () => {
        isLoading = true;
        return async ({ result }) => {
            if (result.type === 'success') {
                resetForms();
                window.location.reload();
            } else if (result.type === 'failure') {
                showError(result.data?.error || 'Failed to create account');
            }
            isLoading = false;
        };
    };

    const handleUpdateSubmit = () => {
        isLoading = true;
        return async ({ result }) => {
            if (result.type === 'success') {
                resetForms();
                window.location.reload();
            } else if (result.type === 'failure') {
                showError(result.data?.error || 'Failed to update account');
            }
            isLoading = false;
        };
    };

    const handleDeleteSubmit = () => {
        isLoading = true;
        return async ({ result }) => {
            if (result.type === 'success') {
                resetForms();
                window.location.reload();
            } else if (result.type === 'failure') {
                showError(result.data?.error || 'Failed to delete account');
            }
            isLoading = false;
        };
    };

    const confirmDelete = (account) => {
        accountToDelete = account;
        showDeleteModal = true;
    };
</script>

<div class="p-6">
    <!-- Header Section -->
    <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-foreground">Account Management</h1>
        <button 
            class="bg-primary text-white px-4 py-2 rounded-lg"
            on:click={() => showCreateModal = true}
        >
            Add New Account
        </button>
    </div>

    <!-- Main content card -->
    <div class="bg-white p-6 rounded-lg shadow-md">
        <!-- Search bar -->
        <div class="flex justify-between mb-4">
            <h2 class="text-xl font-semibold">Accounts List</h2>
            <input
                type="text"
                placeholder="Search accounts..."
                bind:value={searchTerm}
                class="border rounded p-2"
            />
        </div>

        <!-- Table -->
        <div class="overflow-x-auto">
            <table class="w-full">
                <thead>
                    <tr class="bg-muted">
                        <th class="p-2 text-left">Name</th>
                        <th class="p-2 text-left">Role</th>
                        <th class="p-2 text-left">Position</th>
                        <th class="p-2 text-left">Created At</th>
                        <th class="p-2 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {#each filteredAccounts || [] as account (account.id)}
                        <tr class="border-b hover:bg-muted">
                            <td class="p-2">
                                {account.first_name} {account.last_name}
                            </td>
                            <td class="p-2">
                                <span class="px-2 py-1 rounded-full text-sm" 
                                    class:bg-primary-dark={account.role === 'superadmin'}
                                    class:bg-primary={account.role === 'admin'}
                                    class:bg-secondary={account.role === 'employee'}
                                    class:text-white={true}>
                                    {account.role}
                                </span>
                            </td>
                            <td class="p-2">{account.position || '-'}</td>
                            <td class="p-2">
                                {new Date(account.created_at).toLocaleDateString()}
                            </td>
                            <td class="p-2 text-right">
                                <button 
                                    on:click={() => { accountToView = account; showDetailsModal = true; }}
                                    class="text-blue-600 hover:text-blue-800 mr-2"
                                >
                                    Details
                                </button>
                                <button 
                                    on:click={() => editingId = account.id}
                                    class="text-blue-600 hover:text-blue-800 mr-2"
                                >
                                    Edit
                                </button>
                                <button 
                                    on:click={() => confirmDelete(account)}
                                    class="text-red-600 hover:text-red-800"
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    </div>
</div>

<!-- Create Modal -->
{#if showCreateModal}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
         transition:fade={{ duration: 200 }}>
        <div class="bg-white rounded-xl w-full max-w-md transform transition-all"
             in:scale={{ duration: 200, start: 0.95 }}
             out:scale={{ duration: 200, start: 1 }}>
            <div class="p-6 border-b border-gray-100">
                <h2 class="text-xl font-bold">Create New Account</h2>
            </div>
            <form 
                method="POST" 
                action="?/create"
                use:enhance={handleCreateSubmit}
                class="p-6 space-y-4"
            >
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-1">First Name</label>
                        <input
                            type="text"
                            name="first_name"
                            bind:value={newAccount.first_name}
                            class="w-full p-2 border rounded"
                            required
                        />
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Last Name</label>
                        <input
                            type="text"
                            name="last_name"
                            bind:value={newAccount.last_name}
                            class="w-full p-2 border rounded"
                            required
                        />
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Email</label>
                    <input
                        type="email"
                        name="email"
                        bind:value={newAccount.email}
                        class="w-full p-2 border rounded"
                        required
                    />
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Password</label>
                    <input
                        type="password"
                        name="password"
                        bind:value={newAccount.password}
                        class="w-full p-2 border rounded"
                        required
                        minlength="6"
                    />
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Role</label>
                    <select
                        name="role"
                        bind:value={newAccount.role}
                        class="w-full p-2 border rounded"
                        required
                    >
                        <option value="employee">Employee</option>
                        {#if data.currentUser?.role === 'superadmin'}
                            <option value="admin">Admin</option>
                        {/if}
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Contact Number</label>
                    <input
                        type="text"
                        name="contact_number"
                        bind:value={newAccount.contact_number}
                        class="w-full p-2 border rounded"
                    />
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Address</label>
                    <textarea
                        name="address"
                        bind:value={newAccount.address}
                        class="w-full p-2 border rounded"
                        rows="2"
                    ></textarea>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Position</label>
                    <input
                        type="text"
                        name="position"
                        bind:value={newAccount.position}
                        class="w-full p-2 border rounded"
                    />
                </div>
                <div class="flex justify-end gap-2 pt-4">
                    <button 
                        type="button"
                        class="px-4 py-2 text-gray-600"
                        on:click={resetForms}
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit"
                        class="px-4 py-2 bg-primary text-white rounded disabled:opacity-50"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Creating...' : 'Create Account'}
                    </button>
                </div>
            </form>
        </div>
    </div>
{/if}

<!-- Details Modal -->
{#if showDetailsModal && accountToView}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
         transition:fade={{ duration: 200 }}>
        <div class="bg-white rounded-xl w-full max-w-md p-6">
            <h2 class="text-xl font-bold mb-4">Account Details</h2>
            <div class="space-y-3">
                <div class="flex justify-between">
                    <span class="font-medium">Name:</span>
                    <span>{accountToView.first_name} {accountToView.last_name}</span>
                </div>
                <div class="flex justify-between">
                    <span class="font-medium">Role:</span>
                    <span class="px-2 py-1 rounded-full text-sm" 
                        class:bg-primary-dark={accountToView.role === 'superadmin'}
                        class:bg-primary={accountToView.role === 'admin'}
                        class:bg-secondary={accountToView.role === 'employee'}
                        class:text-white={true}>
                        {accountToView.role}
                    </span>
                </div>
                <div class="flex justify-between">
                    <span class="font-medium">Position:</span>
                    <span>{accountToView.position || '-'}</span>
                </div>
                <div class="flex justify-between">
                    <span class="font-medium">Contact:</span>
                    <span>{accountToView.contact_number || '-'}</span>
                </div>
                <div class="flex justify-between">
                    <span class="font-medium">Address:</span>
                    <span class="text-right">{accountToView.address || '-'}</span>
                </div>
                <div class="flex justify-between">
                    <span class="font-medium">Created:</span>
                    <span>{new Date(accountToView.created_at).toLocaleDateString()}</span>
                </div>
            </div>
            <div class="flex justify-end mt-6">
                <button 
                    class="px-4 py-2 bg-primary text-white rounded"
                    on:click={() => { showDetailsModal = false; accountToView = null; }}
                >
                    Close
                </button>
            </div>
        </div>
    </div>
{/if}

<!-- Delete Modal -->
{#if showDeleteModal && accountToDelete}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 class="text-xl font-bold mb-4">Confirm Delete</h2>
            <p class="mb-4">Are you sure you want to delete the account for "{accountToDelete.first_name} {accountToDelete.last_name}"?</p>
            <form 
                method="POST" 
                action="?/delete"
                use:enhance={handleDeleteSubmit}
            >
                <input type="hidden" name="id" value={accountToDelete.id} />
                <div class="flex justify-end gap-2">
                    <button 
                        type="button" 
                        class="px-4 py-2 text-gray-600"
                        on:click={resetForms}
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit"
                        class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </form>
        </div>
    </div>
{/if}

<!-- Error Modal -->
{#if showErrorModal}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 class="text-xl font-bold mb-4 text-red-600">Error</h2>
            <p class="mb-4">{errorMessage}</p>
            <div class="flex justify-end">
                <button 
                    class="px-4 py-2 bg-primary text-white rounded"
                    on:click={() => showErrorModal = false}
                >
                    Close
                </button>
            </div>
        </div>
    </div>
{/if}
