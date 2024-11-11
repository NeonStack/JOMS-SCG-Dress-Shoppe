<script>
    import { enhance } from '$app/forms';
    import { scale, fade } from 'svelte/transition';
    export let data;
    
    let courses = data.courses;
    let searchTerm = '';
    let editingId = null;
    let showCreateModal = false;
    let showDeleteModal = false;
    let showErrorModal = false;
    let errorMessage = '';
    let isLoading = false;
    let courseToDelete = null;
    let newCourse = {
        course_code: '',
        description: ''
    };

    let sortColumn = 'course_code';
    let sortDirection = 'asc';

    // Sort function
    const toggleSort = (column) => {
        if (sortColumn === column) {
            sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            sortColumn = column;
            sortDirection = 'asc';
        }
    };

    // Modified filtered courses with sorting
    $: filteredCourses = courses
        ?.filter(c => 
            c.course_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.description?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        ?.sort((a, b) => {
            const modifier = sortDirection === 'asc' ? 1 : -1;
            switch (sortColumn) {
                case 'course_code':
                    return modifier * a.course_code.localeCompare(b.course_code);
                case 'description':
                    return modifier * ((a.description || '').localeCompare(b.description || ''));
                case 'created_at':
                    return modifier * (new Date(a.created_at) - new Date(b.created_at));
                default:
                    return 0;
            }
        });

    const resetForms = () => {
        editingId = null;
        newCourse = { course_code: '', description: '' };
        showCreateModal = false;
        showDeleteModal = false;
        showErrorModal = false;
        errorMessage = '';
        isLoading = false;
        courseToDelete = null;
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
                showError(result.error || 'Failed to create course');
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
                showError(result.error || 'Failed to update course');
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
                showError(result.error || 'Failed to delete course');
            }
            isLoading = false;
        };
    };

    const confirmDelete = (course) => {
        courseToDelete = course;
        showDeleteModal = true;
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
        <h1 class="text-2xl font-bold text-foreground">Course Management</h1>
        <button 
            class="bg-primary text-white px-4 py-2 rounded-lg"
            on:click={() => showCreateModal = true}
        >
            Add New Course
        </button>
    </div>

    <!-- Main content card -->
    <div class="bg-white p-6 rounded-lg shadow-md">
        <div class="flex justify-between mb-4">
            <h2 class="text-xl font-semibold">Courses List</h2>
            <input
                type="text"
                placeholder="Search courses..."
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
                            on:click={() => toggleSort('course_code')}
                        >
                            Course Code <span class="ml-1">{getSortIcon('course_code')}</span>
                        </th>
                        <th 
                            class="p-2 cursor-pointer hover:bg-gray-200 text-left"
                            on:click={() => toggleSort('description')}
                        >
                            Description <span class="ml-1">{getSortIcon('description')}</span>
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
                    {#each filteredCourses || [] as course (course.id)}
                        <tr class="border-b hover:bg-muted">
                            <td class="p-2">
                                {#if editingId === course.id}
                                    <form 
                                        method="POST" 
                                        action="?/update"
                                        use:enhance={handleUpdateSubmit}
                                        class="flex flex-col gap-2"
                                    >
                                        <input type="hidden" name="id" value={course.id} />
                                        <input
                                            type="text"
                                            name="course_code"
                                            value={course.course_code}
                                            class="px-2 py-1 border rounded"
                                            disabled={isLoading}
                                        />
                                        <input
                                            type="text"
                                            name="description"
                                            value={course.description || ''}
                                            placeholder="Description"
                                            class="px-2 py-1 border rounded"
                                            disabled={isLoading}
                                        />
                                        <div class="flex gap-2">
                                            <button type="submit" class="text-blue-600 hover:text-blue-800" disabled={isLoading}>
                                                Save
                                            </button>
                                            <button type="button" on:click={resetForms} class="text-gray-600" disabled={isLoading}>
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                {:else}
                                    <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                        {course.course_code}
                                    </span>
                                {/if}
                            </td>
                            <td class="p-2">
                                {#if editingId !== course.id}
                                    {course.description || '-'}
                                {/if}
                            </td>
                            <td class="p-2">
                                {new Date(course.created_at).toLocaleDateString()}
                            </td>
                            <td class="p-2 text-right">
                                {#if editingId !== course.id}
                                    <button 
                                        on:click={() => editingId = course.id}
                                        class="text-blue-600 hover:text-blue-800 mr-2"
                                        disabled={isLoading}
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        on:click={() => confirmDelete(course)}
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
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
         transition:fade={{ duration: 200 }}>
        <div class="bg-white rounded-xl w-full max-w-md transform transition-all"
             in:scale={{ duration: 200, start: 0.95 }}
             out:scale={{ duration: 200, start: 1 }}>
            <!-- Header Section -->
            <div class="p-6 border-b border-gray-100">
                <div class="flex items-center gap-4">
                    <div class="bg-primary/10 p-3 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                        </svg>
                    </div>
                    <div>
                        <h2 class="text-xl font-bold text-gray-800">Add New Course</h2>
                        <p class="text-sm text-gray-500">Enter the details for the new course</p>
                    </div>
                </div>
            </div>

            <!-- Form Section -->
            <form 
                method="POST" 
                action="?/create"
                use:enhance={handleCreateSubmit}
                class="p-6 space-y-6"
            >
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2" for="course_code">
                            Course Code
                        </label>
                        <div class="relative">
                            <input
                                type="text"
                                id="course_code"
                                name="course_code"
                                bind:value={newCourse.course_code}
                                class="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 outline-none"
                                placeholder="Enter course code"
                                disabled={isLoading}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2" for="description">
                            Description
                        </label>
                        <div class="relative">
                            <textarea
                                id="description"
                                name="description"
                                bind:value={newCourse.description}
                                class="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 outline-none resize-none"
                                placeholder="Enter course description"
                                rows="3"
                                disabled={isLoading}
                            ></textarea>
                        </div>
                    </div>
                </div>

                <!-- Actions Section -->
                <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                    <button 
                        type="button" 
                        class="px-5 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 transition-all duration-200 font-medium"
                        on:click={resetForms}
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit"
                        class="px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-all duration-200 disabled:opacity-50 font-medium flex items-center gap-2"
                        disabled={isLoading}
                    >
                        {#if isLoading}
                            <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                            </svg>
                        {/if}
                        {isLoading ? 'Creating...' : 'Create Course'}
                    </button>
                </div>
            </form>
        </div>
    </div>
{/if}

<!-- Delete Confirmation Modal -->
{#if showDeleteModal && courseToDelete}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 class="text-xl font-bold mb-4">Confirm Delete</h2>
            <p class="mb-4">Are you sure you want to delete "{courseToDelete.course_code}"?</p>
            <form 
                method="POST" 
                action="?/delete"
                use:enhance={handleDeleteSubmit}
            >
                <input type="hidden" name="id" value={courseToDelete.id} />
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
