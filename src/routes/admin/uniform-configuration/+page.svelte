<script>
    import { enhance } from '$app/forms';
    import { invalidate } from '$app/navigation';
    import { flip } from 'svelte/animate';

    export let data;

    let configs = data.configs || [];
    let courses = data.courses || [];
    let measurementTypes = data.measurementTypes || [];
    let selectedConfig = null;
    let showForm = false;
    let isLoading = false;
    let showErrorModal = false;
    let errorMessage = '';
    let searchTerm = '';

    // Sorting logic
    let sortField = 'created_at';
    let sortDirection = 'desc';

    $: filteredConfigs = configs
        ?.filter(c => 
            c.courses?.course_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.gender?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.wear_type?.toLowerCase().includes(searchTerm.toLowerCase())
        );

    function toggleSort(field) {
        if (sortField === field) {
            sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            sortField = field;
            sortDirection = 'asc';
        }
        
        configs = configs.sort((a, b) => {
            let aVal = field === 'course' ? a.courses?.course_code : a[field];
            let bVal = field === 'course' ? b.courses?.course_code : b[field];
            
            if (typeof aVal === 'string') aVal = aVal.toLowerCase();
            if (typeof bVal === 'string') bVal = bVal.toLowerCase();
            
            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }

    function getSortIcon(field) {
        if (sortField !== field) return '↕';
        return sortDirection === 'asc' ? '↑' : '↓';
    }

    function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    function resetForm() {
        selectedConfig = null;
        showForm = false;
        isLoading = false;
    }

    function showError(message) {
        errorMessage = message;
        showErrorModal = true;
        isLoading = false;
    }

    const handleSubmit = () => {
        isLoading = true;
        return async ({ result }) => {
            if (result.type === 'success') {
                resetForm();
                await invalidate('app:configs');
                window.location.reload(); // Force reload to ensure fresh data
            } else if (result.type === 'error') {
                showError(result.data?.error || 'Operation failed');
            }
            isLoading = false;
        };
    };

    const handleDelete = () => {
        return async ({ result }) => {
            if (result.type === 'success') {
                await invalidate('app:configs');
                window.location.reload(); // Force reload after deletion
            } else if (result.type === 'error') {
                showError(result.data?.error || 'Delete operation failed');
            }
        };
    };
</script>

<div class="p-6">
    <!-- Header Section -->
    <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-foreground">Uniform Configurations</h1>
        <button
            on:click={() => {
                selectedConfig = null;
                showForm = true;
            }}
            class="bg-primary text-white px-4 py-2 rounded-lg"
            disabled={isLoading}
        >
            Add New Configuration
        </button>
    </div>

    <!-- Main content card -->
    <div class="bg-white p-6 rounded-lg shadow-md">
        <div class="flex justify-between mb-4">
            <h2 class="text-xl font-semibold">Configurations List</h2>
            <input
                type="text"
                placeholder="Search configurations..."
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
                            on:click={() => toggleSort('course')}
                        >
                            Course {getSortIcon('course')}
                        </th>
                        <th 
                            class="p-2 cursor-pointer hover:bg-gray-200 text-left"
                            on:click={() => toggleSort('gender')}
                        >
                            Gender {getSortIcon('gender')}
                        </th>
                        <th 
                            class="p-2 cursor-pointer hover:bg-gray-200 text-left"
                            on:click={() => toggleSort('base_price')}
                        >
                            Base Price {getSortIcon('base_price')}
                        </th>
                        <th 
                            class="p-2 cursor-pointer hover:bg-gray-200 text-left"
                            on:click={() => toggleSort('wear_type')}
                        >
                            Wear Type {getSortIcon('wear_type')}
                        </th>
                        <th 
                            class="p-2 cursor-pointer hover:bg-gray-200 text-left"
                            on:click={() => toggleSort('created_at')}
                        >
                            Created At {getSortIcon('created_at')}
                        </th>
                        <th class="p-2 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {#each filteredConfigs as config (config.id)}
                        <tr class="border-b hover:bg-muted">
                            <td class="p-2">
                                <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                    {config.courses?.course_code || 'N/A'}
                                </span>
                            </td>
                            <td class="p-2 capitalize">
                                <span class="px-2 py-1 rounded-full text-sm
                                    {config.gender === 'male' ? 'bg-green-100 text-green-800' : 
                                    config.gender === 'female' ? 'bg-pink-100 text-pink-800' : 
                                    'bg-purple-100 text-purple-800'}">
                                    {config.gender}
                                </span>
                            </td>
                            <td class="p-2">₱{config.base_price.toFixed(2)}</td>
                            <td class="p-2">
                                <span class="px-2 py-1 rounded-full text-sm
                                    {config.wear_type === 'upper' ? 'bg-orange-100 text-orange-800' : 
                                    'bg-indigo-100 text-indigo-800'}">
                                    {config.wear_type}
                                </span>
                            </td>
                            <td class="p-2">{formatDate(config.created_at)}</td>
                            <td class="p-2 text-right">
                                <button
                                    on:click={() => {
                                        selectedConfig = config;
                                        showForm = true;
                                    }}
                                    class="text-blue-600 hover:text-blue-800 mr-2"
                                >
                                    Edit
                                </button>
                                <form
                                    method="POST"
                                    action="?/delete"
                                    use:enhance={handleDelete}
                                    class="inline"
                                    on:submit|preventDefault={async (e) => {
                                        if (!confirm('Are you sure you want to delete this configuration?')) return;
                                        await e.target.submit();
                                    }}
                                >
                                    <input type="hidden" name="id" value={config.id} />
                                    <button type="submit" class="text-red-600 hover:text-red-800">
                                        Delete
                                    </button>
                                </form>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    </div>

    <!-- Configuration Form Modal -->
    {#if showForm}
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white p-6 rounded-lg w-full max-w-lg">
                <h2 class="text-xl font-bold mb-4">
                    {selectedConfig ? 'Edit Configuration' : 'New Configuration'}
                </h2>
                <form
                    method="POST"
                    action={selectedConfig ? '?/update' : '?/create'}
                    use:enhance={handleSubmit}
                    class="space-y-4"
                >
                    {#if selectedConfig}
                        <input type="hidden" name="id" value={selectedConfig.id} />
                    {/if}

                    <div>
                        <label class="block text-sm font-medium text-gray-700" for="courseId">Course</label>
                        <select
                            name="courseId"
                            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                            required
                        >
                            <option value="">Select Course</option>
                            {#each courses as course}
                                <option 
                                    value={course.id}
                                    selected={selectedConfig?.course_id === course.id}
                                >
                                    {course.course_code}
                                </option>
                            {/each}
                        </select>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700" for="gender">Gender</label>
                        <select
                            name="gender"
                            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                            required
                        >
                            <option value="">Select Gender</option>
                            <option value="male" selected={selectedConfig?.gender === 'male'}>Male</option>
                            <option value="female" selected={selectedConfig?.gender === 'female'}>Female</option>
                            <option value="unisex" selected={selectedConfig?.gender === 'unisex'}>Unisex</option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700" for="basePrice">Base Price</label>
                        <input
                            type="number"
                            name="basePrice"
                            step="0.01"
                            value={selectedConfig?.base_price || ''}
                            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                            required
                        />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700" for="additionalCostPerCm">Additional Cost per cm</label>
                        <input
                            type="number"
                            name="additionalCostPerCm"
                            step="0.01"
                            value={selectedConfig?.additional_cost_per_cm || '0'}
                            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                        />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700" for="wearType">Wear Type</label>
                        <select
                            name="wearType"
                            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                            required
                        >
                            <option value="">Select Wear Type</option>
                            <option value="upper" selected={selectedConfig?.wear_type === 'upper'}>Upper</option>
                            <option value="lower" selected={selectedConfig?.wear_type === 'lower'}>Lower</option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700" for="measurementTypes">Required Measurements</label>
                        <div class="mt-2 space-y-2">
                            {#each measurementTypes as measurementType}
                                <label class="inline-flex items-center mr-4">
                                    <input
                                        type="checkbox"
                                        name="measurementTypes"
                                        value={measurementType.id}
                                        checked={selectedConfig?.measurement_type_ids?.includes(measurementType.id)}
                                        class="rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <span class="ml-2">{measurementType.name}</span>
                                </label>
                            {/each}
                        </div>
                    </div>

                    <div class="flex justify-end gap-2">
                        <button
                            type="button"
                            on:click={resetForm}
                            class="px-4 py-2 text-secondary"
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            class="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark disabled:opacity-50"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Saving...' : (selectedConfig ? 'Update' : 'Create')}
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
</div>
