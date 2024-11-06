<script>
    import { enhance } from '$app/forms';
    export let data;
    
    let measurements = data.measurements;
    let searchTerm = '';
    let editingId = null;
    let showCreateModal = false;
    let showDeleteModal = false;
    let showErrorModal = false;
    let errorMessage = '';
    let newMeasurementName = '';
    let isLoading = false;
    let measurementToDelete = null;
    let sortColumn = 'name';
    let sortDirection = 'asc';

    // Filter and sort measurements
    $: filteredMeasurements = measurements
        ?.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()))
        ?.sort((a, b) => {
            const modifier = sortDirection === 'asc' ? 1 : -1;
            if (sortColumn === 'name') {
                return modifier * a.name.localeCompare(b.name);
            } else if (sortColumn === 'created_at') {
                return modifier * (new Date(a.created_at) - new Date(b.created_at));
            }
            return 0;
        });

    // Reset form states
    const resetForms = () => {
        editingId = null;
        newMeasurementName = '';
        showCreateModal = false;
        showDeleteModal = false;
        showErrorModal = false;
        errorMessage = '';
        isLoading = false;
        measurementToDelete = null;
    };

    // Show error modal
    const showError = (message) => {
        errorMessage = message;
        showErrorModal = true;
        isLoading = false;
    };

    // Handle create submission
    const handleCreateSubmit = () => {
        isLoading = true;
        return async ({ result }) => {
            if (result.type === 'success') {
                resetForms();
                window.location.reload();
            } else if (result.type === 'failure') {
                showError(result.data?.error || 'Failed to create measurement');
            }
            isLoading = false;
        };
    };

    // Handle update submission
    const handleUpdateSubmit = () => {
        isLoading = true;
        return async ({ result }) => {
            if (result.type === 'success') {
                resetForms();
                window.location.reload();
            } else if (result.type === 'failure') {
                showError(result.data?.error || 'Failed to update measurement');
            }
            isLoading = false;
        };
    };

    // Handle delete submission
    const handleDeleteSubmit = () => {
        isLoading = true;
        return async ({ result }) => {
            if (result.type === 'success') {
                resetForms();
                window.location.reload();
            } else if (result.type === 'failure') {
                showError(result.data?.error || 'Failed to delete measurement');
            }
            isLoading = false;
        };
    };

    // Confirm delete
    const confirmDelete = (measurement) => {
        measurementToDelete = measurement;
        showDeleteModal = true;
    };

    // Sort function
    const toggleSort = (column) => {
        if (sortColumn === column) {
            sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            sortColumn = column;
            sortDirection = 'asc';
        }
    };

    // Add getSortIcon function for consistency
    function getSortIcon(column) {
        if (sortColumn !== column) return '↕';
        return sortDirection === 'asc' ? '↑' : '↓';
    }
</script>

<div class="p-6">
    <!-- Header Section -->
    <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-foreground">Measurement Types</h1>
        <button 
            class="bg-primary text-white px-4 py-2 rounded-lg"
            on:click={() => showCreateModal = true}
        >
            Add New Measurement
        </button>
    </div>

    <!-- Main content card -->
    <div class="bg-white p-6 rounded-lg shadow-md">
        <div class="flex justify-between mb-4">
            <h2 class="text-xl font-semibold">Measurements List</h2>
            <input
                type="text"
                placeholder="Search measurements..."
                bind:value={searchTerm}
                class="border rounded p-2"
            />
        </div>

        <div class="overflow-x-auto">
            <table class="w-full">
                <thead>
                    <tr class="bg-muted">
                        <th 
                            class="p-2 cursor-pointer hover:bg-gray-200 text-left"
                            on:click={() => toggleSort('name')}
                        >
                            Name <span class="ml-1">{getSortIcon('name')}</span>
                        </th>
                        <th 
                            class="p-2 cursor-pointer hover:bg-gray-200 text-left"
                            on:click={() => toggleSort('created_at')}
                        >
                            Created At <span class="ml-1">{getSortIcon('created_at')}</span>
                        </th>
                        <th class="p-2 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {#each filteredMeasurements || [] as measurement (measurement.id)}
                        <tr class="border-b hover:bg-muted">
                            <td class="p-2">
                                {#if editingId === measurement.id}
                                    <form 
                                        method="POST" 
                                        action="?/update"
                                        use:enhance={handleUpdateSubmit}
                                        class="flex gap-2"
                                    >
                                        <input type="hidden" name="id" value={measurement.id} />
                                        <input
                                            type="text"
                                            name="name"
                                            value={measurement.name}
                                            class="px-2 py-1 border rounded"
                                            disabled={isLoading}
                                        />
                                        <button type="submit" class="text-blue-600 hover:text-blue-800" disabled={isLoading}>Save</button>
                                        <button type="button" on:click={resetForms} class="text-gray-600" disabled={isLoading}>Cancel</button>
                                    </form>
                                {:else}
                                    <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                        {measurement.name}
                                    </span>
                                {/if}
                            </td>
                            <td class="p-2">{new Date(measurement.created_at).toLocaleDateString()}</td>
                            <td class="p-2 text-right">
                                {#if editingId !== measurement.id}
                                    <button 
                                        on:click={() => editingId = measurement.id}
                                        class="text-blue-600 hover:text-blue-800 mr-2"
                                        disabled={isLoading}
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        on:click={() => confirmDelete(measurement)}
                                        class="text-red-600 hover:text-red-800"
                                        disabled={isLoading}
                                    >
                                        Delete
                                    </button>
                                {/if}
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
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 class="text-xl font-bold mb-4">Add New Measurement</h2>
            <form 
                method="POST" 
                action="?/create"
                use:enhance={handleCreateSubmit}
                class="space-y-4"
            >
                <div>
                    <label class="block text-sm font-medium mb-1" for="name">Measurement Name</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        bind:value={newMeasurementName}
                        class="w-full px-3 py-2 border rounded-lg bg-input border-border"
                        disabled={isLoading}
                        required
                    />
                </div>
                <div class="flex justify-end gap-2">
                    <button 
                        type="button" 
                        class="px-4 py-2 text-secondary"
                        on:click={resetForms}
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit"
                        class="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark disabled:opacity-50"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Creating...' : 'Create'}
                    </button>
                </div>
            </form>
        </div>
    </div>
{/if}

<!-- Delete Confirmation Modal -->
{#if showDeleteModal && measurementToDelete}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 class="text-xl font-bold mb-4">Confirm Delete</h2>
            <p class="mb-4">Are you sure you want to delete "{measurementToDelete.name}"?</p>
            <form 
                method="POST" 
                action="?/delete"
                use:enhance={handleDeleteSubmit}
            >
                <input type="hidden" name="id" value={measurementToDelete.id} />
                <div class="flex justify-end gap-2">
                    <button 
                        type="button" 
                        class="px-4 py-2 text-secondary"
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
                    class="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
                    on:click={() => showErrorModal = false}
                >
                    Close
                </button>
            </div>
        </div>
    </div>
{/if}
