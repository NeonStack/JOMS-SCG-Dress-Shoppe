<script>
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabaseClient";

  // State management
  let courses = [];
  let isLoading = true;
  let isSubmitting = false;
  let showAddForm = false;
  let searchQuery = "";
  let dateRange = { start: null, end: null };
  let hasActiveConfigs = null;
  let sortField = "name";
  let sortOrder = "asc";
  let name = "";
  let error = "";
  let deletingCourseId = null;
  let showDeleteConfirm = false;

  // Debounce function to prevent too many API calls
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Helper function to format dates for database query
  function formatDateRange(start, end) {
    if (!start || !end) return null;

    // Create Date objects
    const startDate = new Date(start);
    const endDate = new Date(end);

    // Set start date to beginning of day (00:00:00)
    startDate.setHours(0, 0, 0, 0);

    // Set end date to end of day (23:59:59.999)
    endDate.setHours(23, 59, 59, 999);

    return {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    };
  }

  // Fetch courses with counts
  async function fetchCourses() {
    isLoading = true;
    error = "";

    try {
      // First, fetch the courses with basic info
      let query = supabase.from("courses").select(`
          id,
          name,
          created_at
        `);

      // Apply search filter if exists
      if (searchQuery?.trim()) {
        query = query.ilike("name", `%${searchQuery.trim()}%`);
      }

      // Apply date filter if both dates exist
      if (dateRange.start && dateRange.end) {
        const formattedDates = formatDateRange(dateRange.start, dateRange.end);
        query = query
          .gte("created_at", formattedDates.start)
          .lte("created_at", formattedDates.end);
      }

      // Apply sorting
      if (sortField && ["id", "name", "created_at"].includes(sortField)) {
        query = query.order(sortField, { ascending: sortOrder === "asc" });
      }

      const { data: coursesData, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      if (!coursesData) {
        courses = [];
        return;
      }

      // Now fetch the counts for each course
      const coursesWithCounts = await Promise.all(
        coursesData.map(async (course) => {
          // Get student count
          const { count: studentCount, error: studentError } = await supabase
            .from("students")
            .select("*", { count: "exact", head: true })
            .eq("course_id", course.id);

          if (studentError)
            console.error("Error fetching student count:", studentError);

          // Get active config count
          const { count: configCount, error: configError } = await supabase
            .from("course_configs")
            .select("*", { count: "exact", head: true })
            .eq("course_id", course.id)
            .eq("is_active", true);

          if (configError)
            console.error("Error fetching config count:", configError);

          return {
            ...course,
            studentCount: studentCount || 0,
            configCount: configCount || 0,
          };
        })
      );

      // Apply sorting for count fields if needed
      if (sortField === "studentCount" || sortField === "configCount") {
        coursesWithCounts.sort((a, b) => {
          const valueA = a[sortField];
          const valueB = b[sortField];
          return sortOrder === "asc" ? valueA - valueB : valueB - valueA;
        });
      }

      // Filter by active configs if selected
      if (hasActiveConfigs !== null) {
        courses = coursesWithCounts.filter((course) =>
          hasActiveConfigs ? course.configCount > 0 : course.configCount === 0
        );
      } else {
        courses = coursesWithCounts;
      }
    } catch (err) {
      console.error("Error:", err);
      error = "Failed to fetch courses. Please try again.";
      courses = [];
    } finally {
      isLoading = false;
    }
  }

  // Delete course
  async function handleDelete(courseId) {
    try {
      const { error: deleteError } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (deleteError) throw deleteError;

      await fetchCourses();
      showDeleteConfirm = false;
      deletingCourseId = null;
    } catch (err) {
      console.error('Error deleting course:', err);
      error = 'Failed to delete course. Please try again.';
    }
  }

  // Confirm delete
  function confirmDelete(courseId) {
    deletingCourseId = courseId;
    showDeleteConfirm = true;
  }

  // Cancel delete
  function cancelDelete() {
    deletingCourseId = null;
    showDeleteConfirm = false;
  }

  // Debounced search function
  const debouncedFetch = debounce(() => {
    fetchCourses();
  }, 300);

  // Add new course
  async function handleSubmit() {
    if (isSubmitting) return;
    error = "";

    if (!name.trim()) {
      error = "Course name is required";
      return;
    }

    isSubmitting = true;

    try {
      const { data, error: insertError } = await supabase
        .from("courses")
        .insert([
          {
            name: name.trim(),
          },
        ])
        .select();

      if (insertError) throw insertError;

      await fetchCourses();
      showAddForm = false;
      name = "";
    } catch (err) {
      console.error("Error adding course:", err);
      error = "Failed to add course. Please try again.";
    } finally {
      isSubmitting = false;
    }
  }

  // Handle sorting
  function handleSort(field) {
    if (sortField === field) {
      sortOrder = sortOrder === "asc" ? "desc" : "asc";
    } else {
      sortField = field;
      sortOrder = "asc";
    }
    fetchCourses();
  }

  const headers = [
    { field: "id", label: "Course ID" },
    { field: "name", label: "Course Name" },
    { field: "created_at", label: "Created Date" },
    { field: "studentCount", label: "Student Count" },
    { field: "configCount", label: "Active Configs" },
  ];

  // Watch for changes
  $: {
    if (
      searchQuery !== undefined ||
      dateRange.start ||
      dateRange.end ||
      hasActiveConfigs !== null
    ) {
      debouncedFetch();
    }
  }

  // Initialize
  onMount(() => {
    fetchCourses();
  });
</script>

<div class="container">

  {#if showDeleteConfirm}
    <div class="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50">
      <div class="bg-background p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
        <h2 class="text-xl font-bold mb-4">Confirm Delete</h2>
        <p class="text-secondary mb-6">Are you sure you want to delete this course? This action cannot be undone.</p>
        <div class="flex justify-end gap-4">
          <button 
            class="px-4 py-2 rounded-lg bg-secondary text-accent-foreground hover:opacity-90 transition-opacity"
            on:click={cancelDelete}
          >
            Cancel
          </button>
          <button 
            class="px-4 py-2 rounded-lg bg-primary text-accent-foreground hover:opacity-90 transition-opacity"
            on:click={() => handleDelete(deletingCourseId)}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  {/if}

  <div class="header">
    <h1>Course Management</h1>
    <button 
      class="bg-primary text-accent-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
      on:click={() => showAddForm = !showAddForm}
    >
      {showAddForm ? 'Cancel' : 'Add Course'}
    </button>
  </div>

  {#if showAddForm}
    <form on:submit|preventDefault={handleSubmit} class="course-form">
      <div class="form-group">
        <label for="courseName">Course Name</label>
        <input
          id="courseName"
          type="text"
          bind:value={name}
          maxlength="100"
          required
          class="form-input"
        />
        {#if error}
          <span class="error-message">{error}</span>
        {/if}
      </div>
      <button 
        type="submit" 
        class="bg-accent text-accent-foreground px-6 py-2 rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Adding...' : 'Add Course'}
      </button>
    </form>
  {/if}

  <div class="filters">
    <input
      type="text"
      bind:value={searchQuery}
      placeholder="Search by name..."
      class="search-input"
    />

    <div class="date-range">
      <input type="date" bind:value={dateRange.start} class="date-input" />
      <span>to</span>
      <input type="date" bind:value={dateRange.end} class="date-input" />
    </div>

    <select bind:value={hasActiveConfigs} class="select-input">
      <option value={null}>All Configs</option>
      <option value={true}>Has Active Configs</option>
      <option value={false}>No Active Configs</option>
    </select>
  </div>

  {#if error}
    <div class="bg-primary/10 border border-primary text-primary px-4 py-3 rounded relative mb-6">
      {error}
    </div>
  {/if}

  {#if isLoading}
    <div class="loading">Loading courses...</div>
  {:else if courses.length === 0}
    <div class="empty-state">No courses found</div>
  {:else}
    <div class="table-container">
      <table class="course-table">
        <thead>
          <tr>
            {#each headers as header}
              <th 
                class="sortable-header"
                on:click={() => handleSort(header.field)}
              >
                {header.label}
                {#if sortField === header.field}
                  <span class="sort-indicator">
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                {/if}
              </th>
            {/each}
            <th class="w-20">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each courses as course}
            <tr>
              <td>{course.id}</td>
              <td>{course.name}</td>
              <td>{new Date(course.created_at).toLocaleDateString()}</td>
              <td>{course.studentCount}</td>
              <td>{course.configCount}</td>
              <td>
                <button
                  class="p-2 text-primary hover:text-primary-dark transition-colors"
                  on:click={() => confirmDelete(course.id)}
                  title="Delete course"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                  </svg>
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<style>
  .container {
    @apply max-w-7xl mx-auto p-6;
  }

  .header {
    @apply flex justify-between items-center mb-6;
  }

  .header h1 {
    @apply text-2xl font-bold text-foreground;
  }

  .filters {
    @apply grid grid-cols-1 md:grid-cols-3 gap-4 mb-6;
  }

  .search-input {
    @apply w-full px-4 py-2 border border-border rounded-lg bg-input focus:ring-2 
           focus:ring-accent focus:border-transparent;
  }

  .date-range {
    @apply flex items-center gap-2;
  }

  .date-input {
    @apply px-4 py-2 border border-border rounded-lg bg-input focus:ring-2 
           focus:ring-accent focus:border-transparent flex-1;
  }

  .select-input {
    @apply w-full px-4 py-2 border border-border rounded-lg bg-input focus:ring-2 
           focus:ring-accent focus:border-transparent;
  }

  .loading {
    @apply text-center py-8 text-secondary;
  }

  .empty-state {
    @apply text-center py-8 text-secondary;
  }

  .table-container {
    @apply overflow-x-auto;
  }

  .course-table {
    @apply w-full border-collapse;
  }

  .course-table th {
    @apply bg-muted px-4 py-2 text-left font-medium text-foreground cursor-pointer 
           hover:bg-input transition-colors duration-200;
  }

  .course-table td {
    @apply border-t border-border px-4 py-2 text-foreground;
  }

  .sort-indicator {
    @apply ml-1 text-secondary;
  }

  .course-form {
    @apply bg-background p-6 rounded-lg shadow-md mb-6 border border-border;
  }

  .form-group {
    @apply mb-4;
  }

  .form-group label {
    @apply block text-sm font-medium text-foreground mb-1;
  }

  .form-input {
    @apply w-full px-4 py-2 border border-border rounded-lg bg-input focus:ring-2 
           focus:ring-accent focus:border-transparent;
  }

  .error-message {
    @apply text-primary text-sm mt-1;
  }
</style>