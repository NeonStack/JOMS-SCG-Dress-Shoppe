<script>
  import { enhance } from "$app/forms";
  import { scale, fade } from "svelte/transition";
  export let data;

  let courses = data.courses;
  let searchTerm = "";
  let editingId = null;
  let showCreateModal = false;
  let showDeleteModal = false;
  let showErrorModal = false;
  let errorMessage = "";
  let isLoading = false;
  let courseToDelete = null;
  let newCourse = {
    course_code: "",
    description: "",
  };
  let newCourses = [{ course_code: "", description: "" }];

  const addCourseField = () => {
    newCourses = [...newCourses, { course_code: "", description: "" }];
  };

  const removeCourseField = (index) => {
    newCourses = newCourses.filter((_, i) => i !== index);
  };

  // Initialize sort state
  let sortState = {
    column: "created_at",
    direction: "desc",
  };

  // Updated toggle sort function
  const toggleSort = (column) => {
    if (sortState.column === column) {
      // If same column, toggle direction
      sortState = {
        ...sortState,
        direction: sortState.direction === "asc" ? "desc" : "asc",
      };
    } else {
      // If new column, set it with asc direction
      sortState = {
        column: column,
        direction: "asc",
      };
    }
  };

  // Modified filtered courses with new sorting logic
  $: filteredCourses = courses
    ?.filter(
      (c) =>
        c.course_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    ?.sort((a, b) => {
      const modifier = sortState.direction === "asc" ? 1 : -1;
      switch (sortState.column) {
        case "course_code":
          return modifier * a.course_code.localeCompare(b.course_code);
        case "description":
          return (
            modifier * (a.description || "").localeCompare(b.description || "")
          );
        case "created_at":
          return modifier * (new Date(a.created_at) - new Date(b.created_at));
        default:
          return 0;
      }
    });

  const resetForms = () => {
    editingId = null;
    newCourse = { course_code: "", description: "" };
    showCreateModal = false;
    showDeleteModal = false;
    showErrorModal = false;
    errorMessage = "";
    isLoading = false;
    courseToDelete = null;
    newCourses = [{ course_code: "", description: "" }];
    validationErrors = {
      course_codes: Array(newCourses.length).fill({}),
      descriptions: Array(newCourses.length).fill({}),
    };
    editValidationErrors = { course_code: {}, description: {} };
  };

  const showError = (message) => {
    errorMessage = message;
    showErrorModal = true;
    isLoading = false;
  };

  const handleCreateSubmit = () => {
    let isValid = true;
    newCourses.forEach((course, index) => {
      if (!validateCourseCode(course.course_code, index)) isValid = false;
      if (!validateDescription(course.description, index)) isValid = false;
    });

    if (!isValid) return () => {}; // Prevent form submission if invalid

    isLoading = true;
    // Filter out empty entries
    const validCourses = newCourses.filter(
      (course) => course.course_code.trim() !== ""
    );

    return async ({ result }) => {
      if (result.type === "success") {
        resetForms();
        window.location.reload();
      } else if (result.type === "failure") {
        showError(result.data?.error || "An unexpected error occurred");
      }
      isLoading = false;
    };
  };

  const handleUpdateSubmit = () => {
    isLoading = true;
    return async ({ result }) => {
      if (result.type === "success") {
        resetForms();
        window.location.reload();
      } else if (result.type === "failure") {
        showError(result.data?.error || "An unexpected error occurred");
      }
      isLoading = false;
    };
  };

  const handleDeleteSubmit = () => {
    isLoading = true;
    return async ({ result }) => {
      if (result.type === "success") {
        resetForms();
        window.location.reload();
      } else if (result.type === "failure") {
        showError(result.data?.error || "An unexpected error occurred");
      }
      isLoading = false;
    };
  };

  const confirmDelete = (course) => {
    courseToDelete = course;
    showDeleteModal = true;
  };

  let sortField = "created_at";
  let sortDirection = "desc";

  function sort(field) {
    if (sortField === field) {
      sortDirection = sortDirection === "asc" ? "desc" : "asc";
    } else {
      sortField = field;
      sortDirection = "asc";
    }

    filteredCourses = [...filteredCourses].sort((a, b) => {
      let comparison = 0;
      if (field === "course_code") {
        comparison = a.course_code.localeCompare(b.course_code);
      } else if (field === "description") {
        comparison = (a.description || "").localeCompare(b.description || "");
      } else if (field === "created_at") {
        comparison = new Date(a.created_at) - new Date(b.created_at);
      } else if (field === "student_count") {
        comparison = a.student_count - b.student_count;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }

  // Function to format text: sentence case and remove duplicate whitespace
  const formatText = (str) => {
    if (!str) return str;
    return str
      .toLowerCase()
      .replace(/^.|\s\S/g, (letter) => letter.toUpperCase())
      .replace(/\s+/g, " ")
      .trim();
  };

  // Handle input blur events
  const handleDescriptionBlur = (index) => {
    newCourses[index].description = formatText(newCourses[index].description);
    newCourses = [...newCourses]; // Trigger reactivity
  };

  const handleUpdateDescriptionBlur = (event) => {
    event.target.value = formatText(event.target.value);
  };

  // Validation constants
  const COURSE_CODE_MAX_LENGTH = 20;
  const DESCRIPTION_MAX_LENGTH = 150;
  const COURSE_CODE_PATTERN = /^[A-Za-z0-9-]+$/;

  // Validation state
  let validationErrors = {
    course_codes: Array(newCourses.length).fill({}),
    descriptions: Array(newCourses.length).fill({}),
  };
  let editValidationErrors = { course_code: {}, description: {} };

  // Validation functions
  function validateCourseCode(code, index, isEdit = false) {
    const errors = {};
    if (!code) {
      errors.message = "Course code is required";
    } else if (code.length > COURSE_CODE_MAX_LENGTH) {
      errors.message = `Course code must not exceed ${COURSE_CODE_MAX_LENGTH} characters`;
    } else if (!COURSE_CODE_PATTERN.test(code)) {
      errors.message =
        "Course code can only contain letters, numbers, and dashes";
    }

    if (isEdit) {
      editValidationErrors.course_code = errors;
    } else {
      validationErrors.course_codes[index] = errors;
      validationErrors = validationErrors; // Trigger reactivity
    }
    return Object.keys(errors).length === 0;
  }

  function validateDescription(description, index, isEdit = false) {
    const errors = {};
    if (description && description.length > DESCRIPTION_MAX_LENGTH) {
      errors.message = `Description must not exceed ${DESCRIPTION_MAX_LENGTH} characters`;
    }

    if (isEdit) {
      editValidationErrors.description = errors;
    } else {
      validationErrors.descriptions[index] = errors;
      validationErrors = validationErrors; // Trigger reactivity
    }
    return Object.keys(errors).length === 0;
  }

  // Add a function to handle course code input
  const handleCourseCodeBlur = (index) => {
    if (newCourses[index].course_code) {
      newCourses[index].course_code =
        newCourses[index].course_code.toUpperCase();
      newCourses = [...newCourses]; // Trigger reactivity
    }
  };

  const handleUpdateCourseCodeBlur = (event) => {
    event.target.value = event.target.value.toUpperCase();
  };

  // Add pagination state
  let currentPage = 1;
  let rowsPerPage = 10;
  
  // Calculate total pages and paginated courses
  $: totalPages = Math.ceil((filteredCourses?.length || 0) / rowsPerPage);
  $: paginatedCourses = filteredCourses?.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Navigation functions
  function nextPage() {
    if (currentPage < totalPages) currentPage++;
  }

  function prevPage() {
    if (currentPage > 1) currentPage--;
  }

  function goToPage(page) {
    currentPage = page;
  }

  // Reset to first page when filters change
  $: if (searchTerm) {
    currentPage = 1;
  }

  // Generate page numbers for pagination
  $: pageNumbers = Array.from(
    { length: Math.min(5, totalPages) },
    (_, i) => {
      if (totalPages <= 5) return i + 1;
      if (currentPage <= 3) return i + 1;
      if (currentPage >= totalPages - 2) return totalPages - 4 + i;
      return currentPage - 2 + i;
    }
  );
</script>

<div class="p-6">
  <!-- Header Section -->
  <div
    class="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0 mb-6"
  >
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
            <path
              fill="currentColor"
              d="M3 23h18V1H3zM14.002 6.688L11.504 8.75V3H16.5v5.75z"
            />
          </svg>
        </div>
        <div>
          <h1 class="text-2xl font-bold text-gray-800">Student Courses</h1>
          <p class="text-sm text-gray-500">
            Manage and track student courses
          </p>
        </div>
      </div>
    </div>
    <button
      class="w-full md:w-auto bg-primary text-white px-4 py-2 rounded-lg"
      on:click={() => (showCreateModal = true)}
    >
      Add New Course
    </button>
  </div>

  <!-- Main content card -->
  <div class="bg-white p-6 rounded-lg shadow-md">
    <div class="flex flex-col md:flex-row justify-between gap-4 md:gap-0 mb-4">
      <h2 class="text-xl font-semibold">Courses List</h2>
      <input
        type="text"
        placeholder="Search courses..."
        bind:value={searchTerm}
        class="w-full md:w-auto border rounded p-2"
      />
    </div>

    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="bg-muted max-md:whitespace-nowrap">
            <th
              class="p-2 cursor-pointer hover:bg-gray-200 text-left"
              on:click={() => sort("course_code")}
            >
              Course Code
              {#if sortField === "course_code"}
                <span class="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
              {/if}
            </th>
            <th
              class="p-2 cursor-pointer hover:bg-gray-200 text-left"
              on:click={() => sort("description")}
            >
              Description
              {#if sortField === "description"}
                <span class="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
              {/if}
            </th>
            <th
              class="p-2 cursor-pointer hover:bg-gray-200 text-center"
              on:click={() => sort("student_count")}
            >
              No. of Students
              {#if sortField === "student_count"}
                <span class="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
              {/if}
            </th>
            <th
              class="p-2 cursor-pointer hover:bg-gray-200 text-left"
              on:click={() => sort("created_at")}
            >
              Created At
              {#if sortField === "created_at"}
                <span class="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
              {/if}
            </th>
            <th class="p-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each paginatedCourses || [] as course (course.id)}
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
                      on:input={(e) =>
                        validateCourseCode(e.target.value, 0, true)}
                      on:blur={handleUpdateCourseCodeBlur}
                      class="w-full px-4 py-3 rounded-lg bg-white border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 outline-none {editValidationErrors
                        .course_code?.message
                        ? 'border-red-500'
                        : ''}"
                      maxlength={COURSE_CODE_MAX_LENGTH}
                      disabled={isLoading}
                      required
                    />
                    {#if editValidationErrors.course_code?.message}
                      <p class="text-red-500 text-sm mt-1">
                        {editValidationErrors.course_code.message}
                      </p>
                    {/if}
                    <input
                      type="text"
                      name="description"
                      value={course.description || ""}
                      on:input={(e) =>
                        validateDescription(e.target.value, 0, true)}
                      on:blur={handleUpdateDescriptionBlur}
                      class="w-full px-4 py-3 rounded-lg bg-white border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 outline-none {editValidationErrors
                        .description?.message
                        ? 'border-red-500'
                        : ''}"
                      maxlength={DESCRIPTION_MAX_LENGTH}
                      placeholder="Description"
                      disabled={isLoading}
                    />
                    {#if editValidationErrors.description?.message}
                      <p class="text-red-500 text-sm mt-1">
                        {editValidationErrors.description.message}
                      </p>
                    {/if}
                    <div class="flex gap-2">
                      <button
                        type="submit"
                        class="text-blue-600 hover:text-blue-800"
                        disabled={isLoading}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        on:click={resetForms}
                        class="text-gray-600"
                        disabled={isLoading}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                {:else}
                  <span
                    class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {course.course_code}
                  </span>
                {/if}
              </td>
              <td class="p-2">
                {#if editingId !== course.id}
                  {course.description || "-"}
                {/if}
              </td>
              <td class="p-2 text-center">
                <span
                  class="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-sm"
                >
                  {course.student_count} students
                </span>
              </td>
              <td class="p-2">
                {new Date(course.created_at).toLocaleDateString()}
              </td>
              <td class="p-2 text-right">
                {#if editingId !== course.id}
                  <button
                    on:click={() => (editingId = course.id)}
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

      <!-- Add Pagination Controls -->
      <div class="flex items-center justify-between px-4 py-3 border-t">
        <div class="flex items-center text-sm text-gray-500">
          Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, filteredCourses?.length || 0)} of {filteredCourses?.length || 0} entries
        </div>
        <div class="flex items-center gap-2">
          <button
            class="px-3 py-1 rounded border {currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:bg-gray-50'}"
            on:click={prevPage}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          
          {#each pageNumbers as pageNum}
            <button
              class="px-3 py-1 rounded border {currentPage === pageNum ? 'bg-primary text-white' : 'hover:bg-gray-50'}"
              on:click={() => goToPage(pageNum)}
            >
              {pageNum}
            </button>
          {/each}
          
          <button
            class="px-3 py-1 rounded border {currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:bg-gray-50'}"
            on:click={nextPage}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Create Modal -->
{#if showCreateModal}
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    transition:fade={{ duration: 200 }}
  >
    <div
      class="bg-white rounded-xl w-full max-w-md transform transition-all"
      in:scale={{ duration: 200, start: 0.95 }}
      out:scale={{ duration: 200, start: 1 }}
    >
      <!-- Header Section -->
      <div class="p-6 border-b border-gray-100">
        <div class="flex items-center gap-4">
          <div class="bg-primary/10 p-3 rounded-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-6 h-6 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </div>
          <div>
            <h2 class="text-xl font-bold text-gray-800">Add New Course</h2>
            <p class="text-sm text-gray-500">
              Enter the details for the new course
            </p>
          </div>
        </div>
      </div>

      <!-- Form Section -->
      <form
        method="POST"
        action="?/create"
        use:enhance={handleCreateSubmit}
        class="flex flex-col max-h-[calc(80vh-200px)]"
      >
        <div class="p-6 space-y-6 overflow-y-auto flex-1">
          <div class="space-y-6">
            {#each newCourses as course, index}
              <div class="bg-gray-50 p-4 rounded-lg relative">
                {#if index > 0}
                  <button
                    type="button"
                    class="absolute right-2 top-2 text-red-600 hover:text-red-800"
                    on:click={() => removeCourseField(index)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 011.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </button>
                {/if}
                <div class="space-y-4">
                  <div>
                    <label
                      class="block text-sm font-medium text-gray-700 mb-2"
                      for="course_code_{index}"
                    >
                      Course Code {index + 1}
                    </label>
                    <input
                      type="text"
                      id="course_code_{index}"
                      name="course_codes"
                      bind:value={course.course_code}
                      on:input={() =>
                        validateCourseCode(course.course_code, index)}
                      on:blur={() => handleCourseCodeBlur(index)}
                      class="w-full px-4 py-3 rounded-lg bg-white border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 outline-none {validationErrors
                        .course_codes[index]?.message
                        ? 'border-red-500'
                        : ''}"
                      placeholder="Enter course code"
                      maxlength={COURSE_CODE_MAX_LENGTH}
                      disabled={isLoading}
                      required
                    />
                    {#if validationErrors.course_codes[index]?.message}
                      <p class="text-red-500 text-sm mt-1">
                        {validationErrors.course_codes[index].message}
                      </p>
                    {/if}
                    <p class="text-gray-500 text-sm mt-1">
                      {course.course_code?.length || 0}/{COURSE_CODE_MAX_LENGTH}
                    </p>
                  </div>

                  <div>
                    <label
                      class="block text-sm font-medium text-gray-700 mb-2"
                      for="description_{index}"
                    >
                      Description {index + 1}
                    </label>
                    <textarea
                      id="description_{index}"
                      name="descriptions"
                      bind:value={course.description}
                      on:input={() =>
                        validateDescription(course.description, index)}
                      on:blur={() => handleDescriptionBlur(index)}
                      class="w-full px-4 py-3 rounded-lg bg-white border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 outline-none resize-none {validationErrors
                        .descriptions[index]?.message
                        ? 'border-red-500'
                        : ''}"
                      placeholder="Enter course description"
                      rows="2"
                      maxlength={DESCRIPTION_MAX_LENGTH}
                      disabled={isLoading}
                    ></textarea>
                    {#if validationErrors.descriptions[index]?.message}
                      <p class="text-red-500 text-sm mt-1">
                        {validationErrors.descriptions[index].message}
                      </p>
                    {/if}
                    <p class="text-gray-500 text-sm mt-1">
                      {course.description?.length || 0}/{DESCRIPTION_MAX_LENGTH}
                    </p>
                  </div>
                </div>
              </div>
            {/each}

            <button
              type="button"
              class="text-primary hover:text-primary-dark flex items-center gap-2 mt-4"
              on:click={addCourseField}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clip-rule="evenodd"
                />
              </svg>
              Add Another Course
            </button>
          </div>
        </div>

        <!-- Fixed footer with actions -->
        <div class="p-6 border-t border-gray-100 bg-white">
          <div class="flex items-center justify-end gap-3">
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
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                    fill="none"
                  />
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              {/if}
              {isLoading ? "Creating..." : "Create Course"}
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Delete Confirmation Modal -->
{#if showDeleteModal && courseToDelete}
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
  >
    <div class="bg-white p-6 rounded-lg w-full max-w-md">
      <h2 class="text-xl font-bold mb-4">Confirm Delete</h2>
      <p class="mb-4">
        Are you sure you want to delete "{courseToDelete.course_code}"?
      </p>
      <form method="POST" action="?/delete" use:enhance={handleDeleteSubmit}>
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
            {isLoading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Error Modal -->
{#if showErrorModal}
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    transition:fade={{ duration: 200 }}
  >
    <div
      class="bg-white rounded-xl w-full max-w-md transform transition-all"
      in:scale={{ duration: 200, start: 0.95 }}
      out:scale={{ duration: 200, start: 1 }}
    >
      <div class="p-6 border-b border-gray-100">
        <div class="flex items-center gap-4">
          <div class="bg-red-100 p-3 rounded-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-6 h-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h2 class="text-xl font-bold text-gray-800">Error</h2>
            <p class="text-sm text-red-600">{errorMessage}</p>
          </div>
        </div>
      </div>
      <div class="p-6 flex justify-end">
        <button
          class="px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-all duration-200"
          on:click={() => (showErrorModal = false)}
        >
          Close
        </button>
      </div>
    </div>
  </div>
{/if}
