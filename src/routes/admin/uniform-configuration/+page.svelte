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
    let showDeleteModal = false;
    let configToDelete = null;

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
        selectedMeasurements = new Set(); // Reset selected measurements
    }

    function showError(message) {
        errorMessage = message;
        showErrorModal = true;
        isLoading = false;
    }

    function resetDeleteModal() {
        showDeleteModal = false;
        configToDelete = null;
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

    // Track selected measurement types
    let selectedMeasurements = new Set();

    // Initialize selected measurements when editing
    $: if (selectedConfig) {
        // Convert measurement_specs array to Set of measurement_type_ids
        selectedMeasurements = new Set(selectedConfig.measurement_specs?.map(spec => spec.measurement_type_id) || []);
    }

    // Handle measurement selection - Make this more robust
    function toggleMeasurement(typeId) {
        selectedMeasurements = new Set(selectedMeasurements); // Create new Set to ensure reactivity
        if (selectedMeasurements.has(typeId)) {
            selectedMeasurements.delete(typeId);
        } else {
            selectedMeasurements.add(typeId);
        }
    }
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
                                <button
                                    on:click={() => {
                                        configToDelete = config;
                                        showDeleteModal = true;
                                    }}
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

    <!-- Configuration Form Modal -->
    {#if showForm}
    <div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div class="bg-gradient-to-br from-white via-gray-50 to-muted rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-[0_0_50px_rgba(183,50,51,0.15)] border border-white/50 overflow-hidden animate-scale">
            <!-- Modal Header -->
            <div class="p-6 bg-gradient-to-r from-primary to-primary-dark border-b border-primary/10">
                <h2 class="text-2xl font-bold text-white">
                    {selectedConfig ? 'Edit Configuration' : 'New Configuration'}
                </h2>
                <p class="text-muted mt-2">Configure uniform specifications and measurements</p>
            </div>

            <!-- Modal Body - Scrollable -->
            <div class="flex-1 flex overflow-hidden"> <!-- Changed to flex and overflow-hidden -->
                <form
                    id="configForm"
                    method="POST"
                    action={selectedConfig ? '?/update' : '?/create'}
                    use:enhance={handleSubmit}
                    class="flex-1 flex overflow-hidden"
                >
                    {#if selectedConfig}
                        <input type="hidden" name="id" value={selectedConfig.id} />
                    {/if}

                    <div class="flex flex-1 overflow-hidden">
                        <!-- Left Column - Basic Info (Sticky) -->
                        <div class="w-1/3 p-6 sticky top-0 max-h-[calc(90vh-8rem)]">
                            <div class="bg-white/80 p-6 rounded-xl border border-primary/10 shadow-sm">
                                <h3 class="text-lg font-semibold text-primary mb-4">Basic Information</h3>
                                <div class="space-y-4">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-600 mb-1" for="courseId">Course</label>
                                        <select name="courseId" class="block w-full px-3 py-2 rounded-lg border border-gray-200 bg-white/50 focus:border-primary/30 focus:ring-2 focus:ring-primary/10" required>
                                            <option value="">Select Course</option>
                                            {#each courses as course}
                                                <option value={course.id} selected={selectedConfig?.courses?.id === course.id}>
                                                    {course.course_code}
                                                </option>
                                            {/each}
                                        </select>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-600 mb-1" for="gender">Gender</label>
                                        <select name="gender" class="block w-full px-3 py-2 rounded-lg border border-gray-200 bg-white/50 focus:border-primary/30 focus:ring-2 focus:ring-primary/10" required>
                                            <option value="">Select Gender</option>
                                            <option value="male" selected={selectedConfig?.gender === 'male'}>Male</option>
                                            <option value="female" selected={selectedConfig?.gender === 'female'}>Female</option>
                                            <option value="unisex" selected={selectedConfig?.gender === 'unisex'}>Unisex</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-600 mb-1" for="wearType">Wear Type</label>
                                        <select name="wearType" class="block w-full px-3 py-2 rounded-lg border border-gray-200 bg-white/50 focus:border-primary/30 focus:ring-2 focus:ring-primary/10" required>
                                            <option value="">Select Wear Type</option>
                                            <option value="upper" selected={selectedConfig?.wear_type === 'upper'}>Upper</option>
                                            <option value="lower" selected={selectedConfig?.wear_type === 'lower'}>Lower</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-600 mb-1" for="basePrice">Base Price (₱)</label>
                                        <input type="number" name="basePrice" step="0.01" value={selectedConfig?.base_price || ''} class="block w-full px-3 py-2 rounded-lg border border-gray-200 bg-white/50 focus:border-primary/30 focus:ring-2 focus:ring-primary/10" required />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Right Column - Measurements (Scrollable) -->
                        <div class="w-2/3 p-6 overflow-y-auto">
                            <div class="bg-white/80 p-6 rounded-xl border border-primary/10 shadow-sm space-y-6">
                                <h3 class="text-lg font-semibold text-primary">Measurement Specifications</h3>

                                <!-- Selected Measurements -->
                                {#if selectedMeasurements.size > 0}
                                    <div>
                                        <h4 class="text-sm font-medium text-primary/70 mb-3">Selected Measurements</h4>
                                        <div class="grid grid-cols-3 gap-3">
                                            {#each measurementTypes as measurementType}
                                                {#if selectedMeasurements.has(measurementType.id)}
                                                    {@const spec = selectedConfig?.measurement_specs?.find(s => s.measurement_type_id === measurementType.id)}
                                                    <div class="group"
                                                         on:click|preventDefault={() => toggleMeasurement(measurementType.id)}>
                                                        <div class="bg-primary/5 p-3 rounded-lg border border-primary/20 shadow-sm cursor-pointer group-hover:border-primary/50 group-hover:shadow-md transition-all duration-200">
                                                            <div class="flex items-center justify-between p-2">
                                                                <span class="font-medium text-primary">{measurementType.name}</span>
                                                                <input type="checkbox" 
                                                                       name="selectedMeasurements" 
                                                                       value={measurementType.id}
                                                                       checked={true}
                                                                       class="w-4 h-4 rounded-md border-gray-300 text-primary focus:ring-primary pointer-events-none"
                                                                />
                                                            </div>
                                                            <!-- Stop propagation for input fields to allow interaction -->
                                                            <div class="space-y-2 mt-2" on:click|stopPropagation>
                                                                <div>
                                                                    <label class="block text-xs text-gray-600">Base (cm)</label>
                                                                    <input type="number" 
                                                                           name="baseCm_{measurementType.id}" 
                                                                           value={spec?.base_cm ?? 0}
                                                                           class="block w-full px-2 py-1 text-sm rounded-md border border-gray-200 bg-white/50"
                                                                           min="0" 
                                                                           step="0.1" 
                                                                           required
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label class="block text-xs text-gray-600">Cost/cm (₱)</label>
                                                                    <input type="number" 
                                                                           name="costPerCm_{measurementType.id}" 
                                                                           value={spec?.additional_cost_per_cm ?? 0}
                                                                           class="block w-full px-2 py-1 text-sm rounded-md border border-gray-200 bg-white/50"
                                                                           min="0" 
                                                                           step="0.01" 
                                                                           required
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                {/if}
                                            {/each}
                                        </div>
                                    </div>
                                {/if}

                                <!-- Available Measurements -->
                                <div>
                                    <h4 class="text-sm font-medium text-gray-500 mb-3">Available Measurements</h4>
                                    <div class="grid grid-cols-3 gap-3">
                                        {#each measurementTypes as measurementType}
                                            {#if !selectedMeasurements.has(measurementType.id)}
                                                <div class="group"
                                                     on:click|preventDefault={() => toggleMeasurement(measurementType.id)}>
                                                    <div class="bg-white/90 p-3 rounded-lg border border-gray-100 hover:border-primary/20 hover:shadow-sm cursor-pointer transition-all duration-200">
                                                        <div class="flex items-center justify-between p-2">
                                                            <span class="font-medium text-gray-600 group-hover:text-primary">{measurementType.name}</span>
                                                            <input type="checkbox" 
                                                                   name="selectedMeasurements" 
                                                                   value={measurementType.id}
                                                                   checked={false}
                                                                   class="w-4 h-4 rounded-md border-gray-300 text-primary focus:ring-primary pointer-events-none"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            {/if}
                                        {/each}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>

            <!-- Modal Footer -->
            <div class="p-6 border-t border-primary/5 bg-gradient-to-b from-transparent to-white/80">
                <div class="flex justify-end gap-4">
                    <button type="button" on:click={resetForm}
                            class="px-6 py-2 text-gray-600 hover:text-primary font-medium rounded-lg hover:bg-primary/5 transition-all duration-300"
                            disabled={isLoading}>
                        Cancel
                    </button>
                    <button type="submit" form="configForm"
                            class="px-8 py-2 bg-gradient-to-r from-primary to-primary-dark text-white rounded-lg hover:scale-105 disabled:opacity-50 font-medium shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
                            disabled={isLoading}>
                        {isLoading ? 'Saving...' : (selectedConfig ? 'Update' : 'Create')}
                    </button>
                </div>
            </div>
        </div>
    </div>
    {/if}

    <!-- Delete Confirmation Modal -->
    {#if showDeleteModal}
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white p-6 rounded-lg w-full max-w-md">
                <h2 class="text-xl font-bold mb-4 text-red-600">Confirm Delete</h2>
                <p class="mb-4">Are you sure you want to delete this configuration?</p>
                <div class="flex justify-end gap-2">
                    <button 
                        class="px-4 py-2 text-gray-600 hover:text-gray-800"
                        on:click={resetDeleteModal}
                    >
                        Cancel
                    </button>
                    <form
                        method="POST"
                        action="?/delete"
                        use:enhance={handleDelete}
                        class="inline"
                    >
                        <input type="hidden" name="id" value={configToDelete?.id} />
                        <button 
                            type="submit" 
                            class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                            Delete
                        </button>
                    </form>
                </div>
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
