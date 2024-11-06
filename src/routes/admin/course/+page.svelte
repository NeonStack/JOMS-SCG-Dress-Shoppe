<script>
    import { enhance } from '$app/forms';
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
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 class="text-xl font-bold mb-4">Add New Course</h2>
            <form 
                method="POST" 
                action="?/create"
                use:enhance={handleCreateSubmit}
                class="space-y-4"
            >
                <div>
                    <label class="block text-sm font-medium mb-1" for="course_code">Course Code</label>
                    <input
                        type="text"
                        id="course_code"
                        name="course_code"
                        bind:value={newCourse.course_code}
                        class="w-full px-3 py-2 border rounded-lg bg-input border-border"
                        disabled={isLoading}
                        required
                    />
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1" for="description">Description</label>
                    <input
                        type="text"
                        id="description"
                        name="description"
                        bind:value={newCourse.description}
                        class="w-full px-3 py-2 border rounded-lg bg-input border-border"
                        disabled={isLoading}
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
