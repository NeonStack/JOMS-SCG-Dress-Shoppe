<script>
    import { enhance } from "$app/forms";
    import { onMount } from "svelte";
    
    export let data;
    let students = [];
    let courses = [];
    let uniformConfigs = {};
    let measurementTypes = {};
    let error = null;
    
    onMount(() => {
        try {
            students = data.students || [];
            courses = data.courses || [];
            uniformConfigs = data.uniformConfigs || {};
            measurementTypes = data.measurementTypes || {};
        } catch (err) {
            error = 'Error loading data. Please refresh the page.';
            console.error('Error in component:', err);
        }
    });

    // State for dynamic measurements
    let selectedGender = '';
    let selectedCourseId = '';
    let requiredMeasurements = [];
    
    // Updated reactive statement for measurements
    $: if (selectedGender && selectedCourseId) {
        const configKey = `${selectedGender}_${selectedCourseId}`;
        const configs = uniformConfigs[configKey] || [];
        
        console.log('Selected config key:', configKey); // Debug log
        console.log('Found configs:', configs); // Debug log
        
        // Process required measurements by wear type
        const upperMeasurements = configs
            .filter(c => c.wear_type === 'upper')    // Changed from uniform_type
            .flatMap(c => c.measurement_type_ids || []);
            
        const lowerMeasurements = configs
            .filter(c => c.wear_type === 'lower')    // Changed from uniform_type
            .flatMap(c => c.measurement_type_ids || []);
            
        // Combine all measurements but keep track of their types
        requiredMeasurements = [
            ...upperMeasurements.map(id => ({
                ...measurementTypes[id],
                wear_type: 'upper'    // Changed from uniform_type
            })),
            ...lowerMeasurements.map(id => ({
                ...measurementTypes[id],
                wear_type: 'lower'    // Changed from uniform_type
            }))
        ].filter(Boolean);
        
        console.log('Required measurements:', requiredMeasurements); // Debug log
    } else {
        requiredMeasurements = [];
    }
    
    // Sorting logic
    let sortField = 'created_at';
    let sortDirection = 'desc';
    
    function sort(field) {
        if (sortField === field) {
            sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            sortField = field;
            sortDirection = 'asc';
        }
        
        students = students.sort((a, b) => {
            let comparison = 0;
            if (field === 'course') {
                comparison = a.course?.course_code.localeCompare(b.course?.course_code) || 0;
            } else {
                comparison = a[field] < b[field] ? -1 : a[field] > b[field] ? 1 : 0;
            }
            return sortDirection === 'asc' ? comparison : -comparison;
        });
        students = [...students]; // Trigger reactivity
    }
    
    // Modal state
    let showModal = false;
    let modalMode = 'create';
    let editingStudent = {};
    
    function openCreateModal() {
        modalMode = 'create';
        editingStudent = {};
        showModal = true;
    }
    
    function openEditModal(student) {
        modalMode = 'edit';
        editingStudent = { ...student };
        selectedGender = student.gender;
        // Convert course_id to string when setting selectedCourseId
        selectedCourseId = student.course_id?.toString() || '';
        showModal = true;
    }
    
    function resetForm() {
        editingStudent = {};
        selectedGender = '';
        selectedCourseId = '';
        showModal = false;
    }
    
    // Search functionality
    let searchQuery = '';
    $: filteredStudents = students.filter(student => 
        student.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.course?.course_code?.toLowerCase().includes(searchQuery.toLowerCase())
    );
</script>

{#if error}
    <div class="p-4 bg-red-100 text-red-700 rounded">
        {error}
    </div>
{:else}
    <div class="p-6">
        <!-- Header -->
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-2xl font-bold text-foreground">Student Management</h1>
        </div>

        <!-- Main content card -->
        <div class="bg-white p-6 rounded-lg shadow-md">
            <div class="flex justify-between mb-4">
                <h2 class="text-xl font-semibold">Students List</h2>
                <div class="flex gap-4">
                    <input
                        type="text"
                        bind:value={searchQuery}
                        placeholder="Search students..."
                        class="border rounded p-2"
                    />
                    <button
                        class="bg-primary text-white px-4 py-2 rounded-lg"
                        on:click={openCreateModal}
                    >
                        Add Student
                    </button>
                </div>
            </div>

            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead>
                        <tr class="bg-muted">
                            <th 
                                class="p-2 cursor-pointer hover:bg-gray-200 text-left"
                                on:click={() => sort('first_name')}
                            >
                                First Name
                                {#if sortField === 'first_name'}
                                    <span class="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                {/if}
                            </th>
                            <th 
                                class="p-2 cursor-pointer hover:bg-gray-200 text-left"
                                on:click={() => sort('last_name')}
                            >
                                Last Name
                                {#if sortField === 'last_name'}
                                    <span class="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                {/if}
                            </th>
                            <th 
                                class="p-2 cursor-pointer hover:bg-gray-200 text-left"
                                on:click={() => sort('course')}
                            >
                                Course
                                {#if sortField === 'course'}
                                    <span class="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                {/if}
                            </th>
                            <th 
                                class="p-2 cursor-pointer hover:bg-gray-200 text-left"
                                on:click={() => sort('gender')}
                            >
                                Gender
                                {#if sortField === 'gender'}
                                    <span class="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                {/if}
                            </th>
                            <th class="p-2 text-left">Contact Number</th>
                            <th class="p-2 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each filteredStudents as student}
                            <tr class="border-b hover:bg-muted">
                                <td class="p-2">{student.first_name}</td>
                                <td class="p-2">{student.last_name}</td>
                                <td class="p-2">
                                    <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                        {student.course?.course_code}
                                    </span>
                                </td>
                                <td class="p-2">
                                    <span class="px-2 py-1 rounded-full text-sm
                                        {student.gender === 'male' ? 'bg-green-100 text-green-800' : 'bg-pink-100 text-pink-800'}">
                                        {student.gender}
                                    </span>
                                </td>
                                <td class="p-2">{student.contact_number || '-'}</td>
                                <td class="p-2 text-right">
                                    <button
                                        class="text-blue-600 hover:text-blue-800 mr-2"
                                        on:click={() => openEditModal(student)}
                                    >
                                        Edit
                                    </button>
                                    <form
                                        method="POST"
                                        action="?/delete"
                                        use:enhance={() => {
                                            return async ({ result }) => {
                                                if (result.type === 'success') {
                                                    await invalidate('app:students');
                                                }
                                            };
                                        }}
                                        class="inline"
                                    >
                                        <input type="hidden" name="id" value={student.id} />
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
    </div>
{/if}

{#if showModal}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center overflow-y-auto py-4">
        <div class="bg-white rounded-lg w-full max-w-3xl mx-4 my-8">
            <!-- Modal Header -->
            <div class="border-b px-6 py-4 sticky top-0 bg-white rounded-t-lg">
                <h2 class="text-xl font-bold">
                    {modalMode === 'create' ? 'Add New Student' : 'Edit Student'}
                </h2>
            </div>
            
            <!-- Modal Body -->
            <div class="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                <form
                    id="studentForm"
                    method="POST"
                    action="?/{modalMode}"
                    use:enhance={({ form, data, action, cancel }) => {
                        return async ({ result, update }) => {
                            if (result.type === 'success') {
                                showModal = false;
                                window.location.reload();
                            } else if (result.type === 'error') {
                                console.error('Form submission error:', result);
                                // Optionally show error message to user
                            }
                        };
                    }}
                    class="space-y-4"
                >
                    {#if modalMode === 'edit'}
                        <input type="hidden" name="id" value={editingStudent.id} />
                    {/if}
                    
                    <!-- Two Column Layout for Basic Info -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">First Name</label>
                            <input
                                type="text"
                                name="first_name"
                                value={editingStudent.first_name || ''}
                                class="mt-1 w-full p-2 border rounded"
                                required
                            />
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Last Name</label>
                            <input
                                type="text"
                                name="last_name"
                                value={editingStudent.last_name || ''}
                                class="mt-1 w-full p-2 border rounded"
                                required
                            />
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Gender</label>
                            <select
                                name="gender"
                                bind:value={selectedGender}
                                class="mt-1 w-full p-2 border rounded"
                                required
                            >
                                <option value="">Select Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Course</label>
                            <select
                                name="course_id"
                                bind:value={selectedCourseId}
                                class="mt-1 w-full p-2 border rounded"
                                required
                            >
                                <option value="">Select Course</option>
                                {#each courses as course}
                                    <!-- Convert course.id to string for comparison -->
                                    <option value={course.id.toString()}>
                                        {course.course_code} - {course.description}
                                    </option>
                                {/each}
                            </select>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Contact Number</label>
                            <input
                                type="text"
                                name="contact_number"
                                value={editingStudent.contact_number || ''}
                                class="mt-1 w-full p-2 border rounded"
                            />
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Address</label>
                            <textarea
                                name="address"
                                value={editingStudent.address || ''}
                                class="mt-1 w-full p-2 border rounded"
                                rows="2"
                            ></textarea>
                        </div>
                    </div>
                    
                    <!-- Measurements Section -->
                    {#if requiredMeasurements.length > 0}
                        <div class="border-t pt-6 mt-6">
                            <h3 class="font-bold text-xl mb-6">Required Measurements</h3>
                            
                            <!-- Upper Wear Measurements -->
                            {#if requiredMeasurements.some(m => m.wear_type === 'upper')}    <!-- Changed from uniform_type -->
                                <div class="bg-gray-50 p-6 rounded-lg mb-6">
                                    <h4 class="font-semibold text-lg mb-4 text-primary">Upper Wear Measurements</h4>
                                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {#each requiredMeasurements.filter(m => m.wear_type === 'upper') as measurement}    <!-- Changed from uniform_type -->
                                            <div class="measurement-input-group">
                                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                                    {measurement.name}
                                                </label>
                                                <div class="relative">
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        name="measurement_{measurement.id}"
                                                        value={editingStudent?.measurements?.[measurement.id] || ''}
                                                        class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                                        placeholder="Enter measurement"
                                                        required
                                                    />
                                                    <span class="absolute right-3 top-3 text-gray-500 text-sm">cm</span>
                                                </div>
                                            </div>
                                        {/each}
                                    </div>
                                </div>
                            {/if}

                            <!-- Lower Wear Measurements -->
                            {#if requiredMeasurements.some(m => m.wear_type === 'lower')}    <!-- Changed from uniform_type -->
                                <div class="bg-gray-50 p-6 rounded-lg">
                                    <h4 class="font-semibold text-lg mb-4 text-primary">Lower Wear Measurements</h4>
                                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {#each requiredMeasurements.filter(m => m.wear_type === 'lower') as measurement}    <!-- Changed from uniform_type -->
                                            <div class="measurement-input-group">
                                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                                    {measurement.name}
                                                </label>
                                                <div class="relative">
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        name="measurement_{measurement.id}"
                                                        value={editingStudent?.measurements?.[measurement.id] || ''}
                                                        class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                                        placeholder="Enter measurement"
                                                        required
                                                    />
                                                    <span class="absolute right-3 top-3 text-gray-500 text-sm">cm</span>
                                                </div>
                                            </div>
                                        {/each}
                                    </div>
                                </div>
                            {/if}
                        </div>
                    {/if}
                </form>
            </div>
            
            <!-- Modal Footer -->
            <div class="border-t px-6 py-4 sticky bottom-0 bg-white rounded-b-lg">
                <div class="flex justify-end gap-2">
                    <button
                        type="button"
                        class="px-4 py-2 border rounded hover:bg-gray-100"
                        on:click={resetForm}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="studentForm"
                        class="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
                    >
                        {modalMode === 'create' ? 'Create' : 'Update'}
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    .measurement-input-group input {
        padding-right: 3rem; /* Make room for the cm label */
    }

    .measurement-input-group input::-webkit-outer-spin-button,
    .measurement-input-group input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    .measurement-input-group input[type=number] {
        -moz-appearance: textfield;
    }
</style>

