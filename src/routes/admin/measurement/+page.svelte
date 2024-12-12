<script>
  import { enhance } from "$app/forms";
  import { scale, fade } from "svelte/transition";
  export let data;

  let measurements = data.measurements;
  let searchTerm = "";
  let editingId = null;
  let showCreateModal = false;
  let showDeleteModal = false;
  let showErrorModal = false;
  let errorMessage = "";
  let newMeasurementName = "";
  let isLoading = false;
  let measurementToDelete = null;
  let sortColumn = "created_at";
  let sortDirection = "desc";
  let newMeasurements = [""]; // Array to hold multiple measurement names

  // Validation constants
  const NAME_MAX_LENGTH = 40;
  const NAME_PATTERN = /^[A-Za-z0-9\s-]+$/;

  // Validation state
  let validationErrors = Array(newMeasurements.length).fill({});
  let editValidationError = {};

  // Validation functions
  function validateMeasurementName(name, index, isEdit = false) {
    const errors = {};
    if (!name) {
      errors.message = "Measurement name is required";
    } else if (name.length > NAME_MAX_LENGTH) {
      errors.message = `Name must not exceed ${NAME_MAX_LENGTH} characters`;
    } else if (!NAME_PATTERN.test(name)) {
      errors.message =
        "Name can only contain letters, numbers, spaces, and dashes";
    }

    if (isEdit) {
      editValidationError = errors;
    } else {
      validationErrors[index] = errors;
      validationErrors = [...validationErrors]; // Trigger reactivity
    }
    return Object.keys(errors).length === 0;
  }

  // Filter and sort measurements
  $: filteredMeasurements = measurements
    ?.filter((m) => m.name.toLowerCase().includes(searchTerm.toLowerCase()))
    ?.sort((a, b) => {
      let comparison = 0;
      if (sortColumn === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortColumn === "created_at") {
        comparison = new Date(a.created_at) - new Date(b.created_at);
      } else if (sortColumn === "usage_count") {
        comparison = a.usage_count - b.usage_count;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

  // Add pagination state
  let currentPage = 1;
  let rowsPerPage = 10;
  
  // Calculate total pages and paginated measurements
  $: totalPages = Math.ceil((filteredMeasurements?.length || 0) / rowsPerPage);
  $: paginatedMeasurements = filteredMeasurements?.slice(
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

  // Reset form states
  const resetForms = () => {
    editingId = null;
    newMeasurementName = "";
    showCreateModal = false;
    showDeleteModal = false;
    showErrorModal = false;
    errorMessage = "";
    isLoading = false;
    measurementToDelete = null;
    newMeasurements = [""];
    validationErrors = Array(newMeasurements.length).fill({});
    editValidationError = {};
  };

  // Show error modal
  const showError = (message) => {
    errorMessage = message;
    showErrorModal = true;
    isLoading = false;
  };

  // Function to convert to sentence case and clean whitespace
  const toSentenceCase = (str) => {
    return str
      .toLowerCase()
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .trim() // Remove leading/trailing spaces
      .replace(/^.|\s\S/g, (letter) => letter.toUpperCase());
  };

  // Handle create submission
  const handleCreateSubmit = () => {
    let isValid = true;
    newMeasurements.forEach((name, index) => {
      if (!validateMeasurementName(name, index)) isValid = false;
    });

    if (!isValid) return () => {}; // Prevent form submission if invalid

    isLoading = true;
    // Format names before submitting
    const formattedMeasurements = newMeasurements
      .map((name) => toSentenceCase(name.trim()))
      .filter((name) => name);

    return async ({ result }) => {
      if (result.type === "success") {
        resetForms();
        window.location.reload();
      } else if (result.type === "failure") {
        showError(result.data?.error || "Failed to create measurements");
      }
      isLoading = false;
    };
  };

  // Handle update submission
  const handleUpdateSubmit = () => {
    isLoading = true;
    return async ({ result }) => {
      if (result.type === "success") {
        resetForms();
        window.location.reload();
      } else if (result.type === "failure") {
        showError(result.data?.error || "Failed to update measurement");
      }
      isLoading = false;
    };
  };

  // Handle delete submission
  const handleDeleteSubmit = () => {
    isLoading = true;
    return async ({ result }) => {
      if (result.type === "success") {
        resetForms();
        window.location.reload();
      } else if (result.type === "failure") {
        showError(result.data?.error || "Failed to delete measurement");
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
      sortDirection = sortDirection === "asc" ? "desc" : "asc";
    } else {
      sortColumn = column;
      sortDirection = "asc";
    }
  };

  const addMeasurementField = () => {
    newMeasurements = [...newMeasurements, ""];
  };

  const removeMeasurementField = (index) => {
    newMeasurements = newMeasurements.filter((_, i) => i !== index);
  };
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
              d="M18 1H6v5h3.5v2H6v3h5v2H6v3h3.5v2H6v5h12z"
            />
          </svg>
        </div>
        <div>
          <h1 class="text-2xl font-bold text-gray-800">Measurement Types</h1>
          <p class="text-sm text-gray-500">
            Manage and track measurement types
          </p>
        </div>
      </div>
    </div>
    <button
      class="w-full md:w-auto bg-primary text-white px-4 py-2 rounded-lg"
      on:click={() => (showCreateModal = true)}
    >
      Add New Measurement
    </button>
  </div>

  <!-- Main content card -->
  <div class="bg-white p-6 rounded-lg shadow-md">
    <div class="flex flex-col md:flex-row justify-between gap-4 md:gap-0 mb-4">
      <h2 class="text-xl font-semibold">Measurements List</h2>
      <input
        type="text"
        placeholder="Search measurements..."
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
              on:click={() => toggleSort("name")}
            >
              Name
              {#if sortColumn === "name"}
                <span class="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
              {/if}
            </th>
            <th
              class="p-2 cursor-pointer hover:bg-gray-200 text-left"
              on:click={() => toggleSort("usage_count")}
            >
              Usage Count
              {#if sortColumn === "usage_count"}
                <span class="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
              {/if}
            </th>
            <th
              class="p-2 cursor-pointer hover:bg-gray-200 text-left"
              on:click={() => toggleSort("created_at")}
            >
              Created At
              {#if sortColumn === "created_at"}
                <span class="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
              {/if}
            </th>
            <th class="p-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each paginatedMeasurements || [] as measurement (measurement.id)}
            <tr class="border-b hover:bg-muted">
              <td class="p-2">
                {#if editingId === measurement.id}
                  <form
                    method="POST"
                    action="?/update"
                    use:enhance={handleUpdateSubmit}
                    class="flex gap-2 flex-col items-start"
                  >
                    <input type="hidden" name="id" value={measurement.id} />
                    <input
                      type="text"
                      name="name"
                      value={measurement.name}
                      on:input={(e) =>
                        validateMeasurementName(e.target.value, 0, true)}
                      on:blur={(e) => {
                        measurement.name = toSentenceCase(e.target.value);
                        validateMeasurementName(measurement.name, 0, true);
                      }}
                      class="px-2 py-1 border rounded {editValidationError?.message
                        ? 'border-red-500'
                        : ''}"
                      maxlength={NAME_MAX_LENGTH}
                      disabled={isLoading}
                    />
                    {#if editValidationError?.message}
                      <p class="text-red-500 text-sm mt-1">
                        {editValidationError.message}
                      </p>
                    {/if}
                    <div class="flex gap-2">
                      <button
                        type="submit"
                        class="text-blue-600 hover:text-blue-800"
                        disabled={isLoading}>Save</button
                      >
                      <button
                        type="button"
                        on:click={resetForms}
                        class="text-gray-600"
                        disabled={isLoading}>Cancel</button
                      >
                    </div>
                  </form>
                {:else}
                  <span
                    class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {measurement.name}
                  </span>
                {/if}
              </td>
              <td class="p-2">
                <span
                  class="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-sm"
                >
                  {measurement.usage_count}
                  {measurement.usage_count === 1 ? "use" : "uses"}
                </span>
              </td>
              <td class="p-2"
                >{new Date(measurement.created_at).toLocaleDateString()}</td
              >
              <td class="p-2 text-right">
                {#if editingId !== measurement.id}
                  <button
                    on:click={() => (editingId = measurement.id)}
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

      <!-- Add Pagination Controls -->
      <div class="flex items-center justify-between px-4 py-3 border-t">
        <div class="flex items-center text-sm text-gray-500">
          Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, filteredMeasurements?.length || 0)} of {filteredMeasurements?.length || 0} entries
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
      class="bg-white rounded-xl w-full max-w-md max-h-[80vh] transform transition-all overflow-hidden"
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
                d="M6 6h12M6 12h12m-12 6h12"
              />
            </svg>
          </div>
          <div>
            <h2 class="text-xl font-bold text-gray-800">Add New Measurement</h2>
            <p class="text-sm text-gray-500">
              Enter the measurement type details
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
          <div class="space-y-4">
            {#each newMeasurements as measurement, index}
              <div class="flex items-center gap-2">
                <div class="flex-1">
                  <label
                    class="block text-sm font-medium text-gray-700 mb-2"
                    for="name_{index}"
                  >
                    Measurement Name {index + 1}
                  </label>
                  <input
                    type="text"
                    id="name_{index}"
                    name="names"
                    bind:value={newMeasurements[index]}
                    on:input={() =>
                      validateMeasurementName(newMeasurements[index], index)}
                    on:blur={(e) => {
                      newMeasurements[index] = toSentenceCase(e.target.value);
                      validateMeasurementName(newMeasurements[index], index);
                    }}
                    class="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 outline-none {validationErrors[
                      index
                    ]?.message
                      ? 'border-red-500'
                      : ''}"
                    placeholder="Enter measurement name"
                    maxlength={NAME_MAX_LENGTH}
                    disabled={isLoading}
                    required
                  />
                  {#if validationErrors[index]?.message}
                    <p class="text-red-500 text-sm mt-1">
                      {validationErrors[index].message}
                    </p>
                  {/if}
                  <p class="text-gray-500 text-sm mt-1">
                    {newMeasurements[index]?.length || 0}/{NAME_MAX_LENGTH} characters
                  </p>
                </div>
                {#if index > 0}
                  <button
                    type="button"
                    class="mt-8 p-2 text-red-600 hover:text-red-800"
                    on:click={() => removeMeasurementField(index)}
                  >
                    <p class="font-bold">x</p>
                  </button>
                {/if}
              </div>
            {/each}

            <button
              type="button"
              class="text-primary hover:text-primary-dark flex items-center gap-2"
              on:click={addMeasurementField}
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
              Add Another Measurement
            </button>
          </div>
        </div>

        <!-- Actions Section -->
        <div class="p-6 border-t border-gray-100 bg-white">
          <div
            class="flex items-center justify-end gap-3 pt-4 border-t border-gray-100"
          >
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
              {isLoading ? "Creating..." : "Create Measurement"}
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Delete Confirmation Modal -->
{#if showDeleteModal && measurementToDelete}
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
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </div>
          <div>
            <h2 class="text-xl font-bold text-gray-800">Confirm Delete</h2>
            <p class="text-sm text-gray-500">This action cannot be undone</p>
          </div>
        </div>
      </div>

      <div class="p-6">
        <p class="mb-4">
          Are you sure you want to delete "{measurementToDelete.name}"?
        </p>
        <form method="POST" action="?/delete" use:enhance={handleDeleteSubmit}>
          <input type="hidden" name="id" value={measurementToDelete.id} />
          <div class="flex justify-end gap-3">
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
              class="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 disabled:opacity-50 font-medium flex items-center gap-2"
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
              {isLoading ? "Deleting..." : "Delete Measurement"}
            </button>
          </div>
        </form>
      </div>
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
