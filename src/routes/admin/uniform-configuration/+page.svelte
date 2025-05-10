<script>
  import { enhance } from "$app/forms";
  import { invalidate } from "$app/navigation";
  import { flip } from "svelte/animate";

  export let data;

  let configs = data.configs || [];
  let courses = data.courses || [];
  let measurementTypes = data.measurementTypes || [];
  let selectedConfig = null;
  let showForm = false;
  let isLoading = false;
  let showErrorModal = false;
  let errorMessage = "";
  let searchTerm = "";
  let showDeleteModal = false;
  let configToDelete = null;

  // Sorting logic
  let sortField = "created_at";
  let sortDirection = "desc";

  $: filteredConfigs = configs
    ?.filter(
      (c) =>
        c.courses?.course_code
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        c.gender?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.wear_type?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    ?.sort((a, b) => {
      let aVal = sortField === "course" ? a.courses?.course_code : a[sortField];
      let bVal = sortField === "course" ? b.courses?.course_code : b[sortField];

      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

  function toggleSort(field) {
    if (sortField === field) {
      sortDirection = sortDirection === "asc" ? "desc" : "asc";
    } else {
      sortField = field;
      sortDirection = "asc";
    }
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function resetForm() {
    selectedConfig = null;
    selectedCourseId = "";
    selectedGender = "";
    selectedWearType = "";
    showForm = false;
    isLoading = false;
    selectedMeasurements = new Set();
  }

  function showError(message) {
    console.log("here at showError");
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
      if (result.type === "success") {
        resetForm();
        await invalidate("app:configs");
        window.location.reload(); // Force reload to ensure fresh data
      } else if (result.type === "error") {
        showError(result.data?.error || "Operation failed");
      }
      isLoading = false;
    };
  };

  const handleDelete = () => {
    return async ({ result }) => {
      console.log("Backend result:", result);
      resetDeleteModal();

      if (result.data?.data?.error) {
        showError(result.data?.data?.error);
      } else if (result.type === "success") {
        await invalidate("app:configs");
        window.location.reload();
      } else {
        showError("An unexpected error occurred.");
      }
    };
  };

  // Track selected measurement types
  let selectedMeasurements = new Set();

  // Change from Set to Map to store both selection state and default values
  let selectedMeasurementMap = new Map();

  // Initialize selected measurements and their values when editing
  $: if (selectedConfig) {
    selectedMeasurementMap = new Map();
    selectedConfig.measurement_specs?.forEach(spec => {
      selectedMeasurementMap.set(spec.measurement_type_id, {
        base_cm: spec.base_cm,
        additional_cost_per_cm: spec.additional_cost_per_cm
      });
    });
  }

  // Computed property to get just the IDs (for compatibility with existing code)
  $: selectedMeasurements = new Set(selectedMeasurementMap.keys());

  // Handle measurement selection with default values
  function toggleMeasurement(typeId) {
    // Create a new Map to ensure reactivity
    selectedMeasurementMap = new Map(selectedMeasurementMap);
    
    if (selectedMeasurementMap.has(typeId)) {
      selectedMeasurementMap.delete(typeId);
    } else {
      // Find the measurement type to get its default values
      const measurementType = measurementTypes.find(m => m.id === typeId);
      console.log("Selected measurement:", measurementType); // Debug
      
      // Use defaults or fallback to 0 if null/undefined
      const defaultBaseCm = measurementType.default_base_cm !== null 
                            ? measurementType.default_base_cm 
                            : 0;
      const defaultCostPerCm = measurementType.default_additional_cost_per_cm !== null 
                               ? measurementType.default_additional_cost_per_cm 
                               : 0;
                               
      selectedMeasurementMap.set(typeId, {
        base_cm: defaultBaseCm,
        additional_cost_per_cm: defaultCostPerCm
      });
    }
  }

  // Add the configuration map
  let configurationMap = data.configurationMap;

  // Local variables to hold selected options
  let selectedCourseId = "";
  let selectedGender = "";
  let selectedWearType = "";

  // Compute disabled options based on existing configurations
  $: disabledGenders =
    selectedCourseId && !selectedConfig
      ? getDisabledGenders(selectedCourseId)
      : [];

  $: disabledWearTypes =
    selectedCourseId && selectedGender && !selectedConfig
      ? getDisabledWearTypes(selectedCourseId, selectedGender)
      : [];

  function getDisabledGenders(courseId) {
    const genders = ["male", "female"];
    const disabled = [];
    if (configurationMap[courseId]) {
      genders.forEach((gender) => {
        const wearTypes = configurationMap[courseId][gender];
        if (wearTypes && wearTypes.size >= 2) {
          // Assuming two wear types: 'upper' and 'lower'
          disabled.push(gender);
        }
      });
    }
    return disabled;
  }

  function getDisabledWearTypes(courseId, gender) {
    if (configurationMap[courseId] && configurationMap[courseId][gender]) {
      return Array.from(configurationMap[courseId][gender]);
    }
    return [];
  }

  function isCourseDisabled(courseId) {
    const genders = ["male", "female"];
    if (configurationMap[courseId]) {
      return genders.every((gender) => {
        const wearTypes = configurationMap[courseId][gender];
        return wearTypes && wearTypes.size >= 2;
      });
    }
    return false;
  }

  // Update selectedConfig when editing
  $: if (selectedConfig) {
    selectedCourseId = selectedConfig.course_id?.toString(); // Ensure selectedCourseId is a string
    selectedGender = selectedConfig.gender;
    selectedWearType = selectedConfig.wear_type;
  }

  // Add pagination state
  let currentPage = 1;
  let rowsPerPage = 10;
  
  // Calculate total pages and paginated configs
  $: totalPages = Math.ceil((filteredConfigs?.length || 0) / rowsPerPage);
  $: paginatedConfigs = filteredConfigs?.slice(
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
            class="text-primary w-6 h-6"
            viewBox="0 0 512 512"
            {...$$props}
          >
            <path
              fill="currentColor"
              fill-rule="evenodd"
              d="m234.67 85.33l-.004 213.338h-21.333v42.666h21.333l.005 85.33h42.666l-.004-85.33h21.333v-42.666h-21.333l.004-213.338zm-128.006 0v85.355H85.331v42.645h21.333v213.333h42.667V213.33h21.333v-42.645h-21.333V85.33zm255.981.004v128h-21.333l.013 42.663h21.333v170.666h42.688V255.997h21.333l-.013-42.663h-21.333l.013-128.004z"
            />
          </svg>
        </div>
        <div>
          <h1 class="text-2xl font-bold text-gray-800">Uniform Configuration</h1>
          <p class="text-sm text-gray-500">
            Manage and customize uniform configurations
          </p>
        </div>
      </div>
    </div>
    <button
      on:click={() => {
        selectedConfig = null;
        showForm = true;
      }}
      class="w-full md:w-auto bg-primary text-white px-4 py-2 rounded-lg"
      disabled={isLoading}
    >
      Add New Configuration
    </button>
  </div>

  <!-- Main content card -->
  <div class="bg-white p-6 rounded-lg shadow-md">
    <div class="flex flex-col md:flex-row justify-between gap-4 md:gap-0 mb-4">
      <h2 class="text-xl font-semibold">Configurations List</h2>
      <input
        type="text"
        placeholder="Search configurations..."
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
              on:click={() => toggleSort("course")}
            >
              Course
              {#if sortField === "course"}
                <span class="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
              {/if}
            </th>
            <th
              class="p-2 cursor-pointer hover:bg-gray-200 text-left"
              on:click={() => toggleSort("gender")}
            >
              Gender
              {#if sortField === "gender"}
                <span class="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
              {/if}
            </th>
            <th
              class="p-2 cursor-pointer hover:bg-gray-200 text-left"
              on:click={() => toggleSort("base_price")}
            >
              Base Price
              {#if sortField === "base_price"}
                <span class="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
              {/if}
            </th>
            <th
              class="p-2 cursor-pointer hover:bg-gray-200 text-left"
              on:click={() => toggleSort("wear_type")}
            >
              Wear Type
              {#if sortField === "wear_type"}
                <span class="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
              {/if}
            </th>
            <th
              class="p-2 cursor-pointer hover:bg-gray-200 text-left"
              on:click={() => toggleSort("created_at")}
            >
              Created At
              {#if sortField === "created_at"}
                <span class="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
              {/if}
            </th>
            <th class="p-2 text-left">Reg. Students</th>
            <th class="p-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each paginatedConfigs || [] as config (config.id)}
            <tr class="border-b hover:bg-muted">
              <td class="p-2">
                <span
                  class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {config.courses?.course_code || "N/A"}
                </span>
              </td>
              <td class="p-2 capitalize">
                <span
                  class="px-2 py-1 rounded-full text-sm
                                    {config.gender === 'male'
                    ? 'bg-green-100 text-green-800'
                    : config.gender === 'female'
                      ? 'bg-pink-100 text-pink-800'
                      : ''}"
                >
                  {config.gender}
                </span>
              </td>
              <td class="p-2">₱{config.base_price.toFixed(2)}</td>
              <td class="p-2">
                <span
                  class="px-2 py-1 rounded-full text-sm
                                    {config.wear_type === 'upper'
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-indigo-100 text-indigo-800'}"
                >
                  {config.wear_type}
                </span>
              </td>
              <td class="p-2">{formatDate(config.created_at)}</td>
              <td class="p-2">
                <span
                  class="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-sm"
                >
                  {config.student_count} student/s
                </span>
              </td>
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

      <!-- Add Pagination Controls -->
      <div class="flex items-center justify-between px-4 py-3 border-t">
        <div class="flex items-center text-sm text-gray-500">
          Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, filteredConfigs?.length || 0)} of {filteredConfigs?.length || 0} entries
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

  <!-- Configuration Form Modal -->
  {#if showForm}
    <div
      class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-2 md:p-4 overflow-hidden"
    >
      <div
        class="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-xl overflow-hidden animate-scale border border-gray-100"
      >
        <!-- Modal Header -->
        <div
          class="p-4 md:p-6 bg-gradient-to-r from-primary to-primary-dark"
        >
          <div class="flex justify-between items-center">
            <div>
              <h2 class="text-xl md:text-2xl font-bold text-white">
                {selectedConfig ? "Edit Configuration" : "New Configuration"}
              </h2>
              <p class="text-sm md:text-base text-white/80 mt-1">
                Configure uniform specifications and measurements
              </p>
            </div>
            <button 
              type="button" 
              class="text-white/80 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
              on:click={resetForm}
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        <!-- Modal Body - Scrollable -->
        <div class="flex-1 flex overflow-hidden">
          <form
            id="configForm"
            method="POST"
            action={selectedConfig ? "?/update" : "?/create"}
            use:enhance={handleSubmit}
            class="flex-1 flex flex-col md:flex-row overflow-hidden"
          >
            {#if selectedConfig}
              <input type="hidden" name="id" value={selectedConfig.id} />
            {/if}

            <div class="flex flex-col md:flex-row flex-1 overflow-hidden">
              <!-- Left Column - Basic Info -->
              <div
                class="w-full md:w-1/3 p-4 md:p-6 max-h-[30vh] md:max-h-[calc(90vh-8rem)] overflow-y-auto border-b md:border-b-0 md:border-r border-gray-200"
              >
                <div
                  class="rounded-xl shadow-sm space-y-5"
                >
                  <h3
                    class="text-base md:text-lg font-semibold text-gray-800 mb-4 flex items-center"
                  >
                    <span class="bg-primary/10 p-1.5 rounded-lg mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8h-5v2zM9 8H4v2h5V8z" clip-rule="evenodd" />
                      </svg>
                    </span>
                    Basic Information
                  </h3>
                  <div class="space-y-4">
                    <div class="group">
                      <label
                        class="block text-sm font-medium text-gray-700 mb-1 group-hover:text-primary transition-colors"
                        for="courseId">Course</label
                      >
                      <div class="relative">
                        <select
                          name="courseId"
                          bind:value={selectedCourseId}
                          on:change={() => {
                            selectedGender = "";
                            selectedWearType = "";
                          }}
                          class="block w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 outline-none appearance-none"
                          disabled={selectedConfig ? true : false}
                          required
                        >
                          <option value="">Select Course</option>
                          {#each courses as course}
                            <option
                              value={course.id.toString()}
                              disabled={!selectedConfig &&
                                isCourseDisabled(course.id.toString()) &&
                                course.id.toString() !== selectedCourseId}
                            >
                              {course.course_code}
                              {#if !selectedConfig && isCourseDisabled(course.id.toString()) && course.id.toString() !== selectedCourseId}
                                (All Configurations Set)
                              {/if}
                            </option>
                          {/each}
                        </select>
                        <div class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      {#if selectedConfig}
                        <input
                          type="hidden"
                          name="courseId"
                          value={selectedCourseId}
                        />
                      {/if}
                    </div>
                    
                    <div class="group">
                      <label
                        class="block text-sm font-medium text-gray-700 mb-1 group-hover:text-primary transition-colors"
                        for="gender">Gender</label
                      >
                      <div class="relative">
                        <select
                          name="gender"
                          bind:value={selectedGender}
                          on:change={() => (selectedWearType = "")}
                          class="block w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 outline-none appearance-none"
                          disabled={selectedConfig ? true : false}
                          required
                        >
                          <option value="">Select Gender</option>
                          <option
                            value="male"
                            disabled={!selectedConfig &&
                              disabledGenders.includes("male")}
                          >
                            Male
                            {#if !selectedConfig && disabledGenders.includes("male")}
                              (All Wear Types Configured)
                            {/if}
                          </option>
                          <option
                            value="female"
                            disabled={!selectedConfig &&
                              disabledGenders.includes("female")}
                          >
                            Female
                            {#if !selectedConfig && disabledGenders.includes("female")}
                              (All Wear Types Configured)
                            {/if}
                          </option>
                        </select>
                        <div class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      {#if selectedConfig}
                        <input
                          type="hidden"
                          name="gender"
                          value={selectedGender}
                        />
                      {/if}
                    </div>
                    
                    <div class="group">
                      <label
                        class="block text-sm font-medium text-gray-700 mb-1 group-hover:text-primary transition-colors"
                        for="wearType">Wear Type</label
                      >
                      <div class="relative">
                        <select
                          name="wearType"
                          bind:value={selectedWearType}
                          class="block w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 outline-none appearance-none"
                          disabled={selectedConfig ? true : false}
                          required
                        >
                          <option value="">Select Wear Type</option>
                          <option
                            value="upper"
                            disabled={!selectedConfig &&
                              disabledWearTypes.includes("upper")}
                          >
                            Upper
                            {#if !selectedConfig && disabledWearTypes.includes("upper")}
                              (Already Configured)
                            {/if}
                          </option>
                          <option
                            value="lower"
                            disabled={!selectedConfig &&
                              disabledWearTypes.includes("lower")}
                          >
                            Lower
                            {#if !selectedConfig && disabledWearTypes.includes("lower")}
                              (Already Configured)
                            {/if}
                          </option>
                        </select>
                        <div class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      {#if selectedConfig}
                        <input
                          type="hidden"
                          name="wearType"
                          value={selectedWearType}
                        />
                      {/if}
                    </div>
                    
                    <div class="group">
                      <label
                        class="block text-sm font-medium text-gray-700 mb-1 group-hover:text-primary transition-colors"
                        for="basePrice">Base Price (₱)</label
                      >
                      <div class="relative">
                        <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                          ₱
                        </span>
                        <input
                          type="number"
                          name="basePrice"
                          step="0.01"
                          value={selectedConfig?.base_price || ""}
                          class="block w-full pl-7 pr-3 py-2.5 rounded-lg border border-gray-300 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 outline-none"
                          placeholder="0.00"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Right Column - Measurements -->
              <div class="w-full md:w-2/3 p-4 md:p-6 flex-1 overflow-y-auto">
                <div class="rounded-xl space-y-6">
                  <h3 class="text-base md:text-lg font-semibold text-gray-800 flex items-center">
                    <span class="bg-primary/10 p-1.5 rounded-lg mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
                      </svg>
                    </span>
                    Measurement Specifications
                  </h3>

                  <!-- Selected Measurements -->
                  {#if selectedMeasurements.size > 0}
                    <div class="bg-gray-50 p-4 rounded-xl border border-gray-200">
                      <div class="flex items-center justify-between mb-4">
                        <h4 class="text-sm font-medium text-primary flex items-center">
                          <span class="inline-flex items-center justify-center w-5 h-5 mr-2 bg-primary text-white text-xs rounded-full">
                            {selectedMeasurements.size}
                          </span>
                          Selected Measurements
                        </h4>
                        {#if selectedMeasurements.size > 0}
                          <div class="flex items-center text-xs">
                            <span class="text-gray-500 flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                              </svg>
                              Click on a card to remove
                            </span>
                          </div>
                        {/if}
                      </div>
                      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {#each measurementTypes as measurementType}
                          {#if selectedMeasurements.has(measurementType.id)}
                            {@const measurementValues = selectedMeasurementMap.get(measurementType.id) || {}}
                            <div class="group relative">
                              <div
                                class="bg-white rounded-lg border border-primary/30 shadow-sm hover:shadow-md hover:border-primary transition-all duration-200 overflow-hidden h-full"
                              >
                                <!-- Card Header -->
                                <div class="flex justify-between items-center p-3 border-b border-gray-100 bg-primary/5">
                                  <h5 class="font-medium text-primary truncate">{measurementType.name}</h5>
                                  <div 
                                    class="shrink-0 ml-2 cursor-pointer bg-white text-primary hover:bg-primary hover:text-white rounded-full p-1 border border-primary/30 transition-colors"
                                    on:click|preventDefault|stopPropagation={() => toggleMeasurement(measurementType.id)}
                                    title="Remove measurement"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                      <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                                    </svg>
                                  </div>
                                </div>
                                
                                <!-- Card Body - Selected Measurements -->
                                <div class="p-3 space-y-3">
                                  <!-- Hidden input to store the measurement type ID -->
                                  <input
                                    type="hidden"
                                    name="selectedMeasurements"
                                    value={measurementType.id}
                                  />
                                  
                                  <div class="space-y-2.5">
                                    <div>
                                      <div>
                                        <label class="block text-xs font-medium text-gray-700 mb-1">
                                          Base Measurement (cm)
                                          {#if measurementType.default_base_cm !== null}
                                            <span class="block text-xs font-normal text-gray-500">Default: {measurementType.default_base_cm}</span>
                                          {/if}
                                        </label>
                                      </div>
                                      <div class="relative">
                                        <input
                                          type="number"
                                          name="baseCm_{measurementType.id}"
                                          value={measurementValues.base_cm}
                                          class="block w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                          min="0"
                                          max="500"
                                          step="0.1"
                                          required
                                          placeholder={measurementType.default_base_cm !== null ? measurementType.default_base_cm : ""}
                                        />
                                        <span class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">cm</span>
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <div>
                                        <label class="block text-xs font-medium text-gray-700 mb-1">
                                          Additional Cost Per cm (₱)
                                          {#if measurementType.default_additional_cost_per_cm !== null}
                                            <span class="block text-xs font-normal text-gray-500">Default: {measurementType.default_additional_cost_per_cm}</span>
                                          {/if}
                                        </label>
                                      </div>
                                      <div class="relative">
                                        <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">₱</span>
                                        <input
                                          type="number"
                                          name="costPerCm_{measurementType.id}"
                                          value={measurementValues.additional_cost_per_cm}
                                          class="block w-full pl-6 pr-8 py-2 text-sm rounded-md border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                          min="0"
                                          step="0.01"
                                          required
                                          placeholder={measurementType.default_additional_cost_per_cm !== null ? measurementType.default_additional_cost_per_cm : ""}
                                        />
                                        <span class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">/cm</span>
                                      </div>
                                    </div>
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
                  <div class="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div class="flex items-center justify-between mb-4">
                      <h4 class="text-sm font-medium text-gray-700 flex items-center">
                        <span class="inline-flex items-center justify-center w-5 h-5 mr-2 bg-gray-200 text-gray-700 text-xs rounded-full">
                          {measurementTypes.length - selectedMeasurements.size}
                        </span>
                        Available Measurements
                      </h4>
                      {#if measurementTypes.length - selectedMeasurements.size > 0}
                        <div class="flex items-center text-xs">
                          <span class="text-gray-500 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                            </svg>
                            Click on a card to add
                          </span>
                        </div>
                      {/if}
                    </div>
                    
                    {#if measurementTypes.filter(m => !selectedMeasurements.has(m.id)).length > 0}
                      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {#each measurementTypes as measurementType}
                          {#if !selectedMeasurements.has(measurementType.id)}
                            <!-- Available Measurements card design improvement -->
                            <div 
                              class="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200 cursor-pointer h-full"
                              on:click|preventDefault={() => toggleMeasurement(measurementType.id)}
                            >
                              <div class="flex justify-between items-center p-3 border-b border-gray-100">
                                <h5 class="font-medium text-gray-700 truncate group-hover:text-primary">{measurementType.name}</h5>
                                <div class="shrink-0 ml-2 bg-gray-100 text-gray-600 hover:bg-primary hover:text-white rounded-full p-1 transition-colors">
                                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
                                  </svg>
                                </div>
                              </div>
                              <div class="p-3">
                                <div class="space-y-2">
                                  {#if measurementType.default_base_cm !== null || measurementType.default_additional_cost_per_cm !== null}
                                    {#if measurementType.default_base_cm !== null}
                                      <div class="flex items-center text-sm">
                                        <span class="text-gray-500 w-20 shrink-0">Base:</span>
                                        <span class="font-medium text-gray-700 ml-2">{measurementType.default_base_cm} cm</span>
                                      </div>
                                    {/if}
                                    {#if measurementType.default_additional_cost_per_cm !== null}
                                      <div class="flex items-center text-sm">
                                        <span class="text-gray-500 w-20 shrink-0">Cost/cm:</span>
                                        <span class="font-medium text-gray-700 ml-2">₱{measurementType.default_additional_cost_per_cm}</span>
                                      </div>
                                    {/if}
                                  {:else}
                                    <p class="text-xs text-gray-500 italic">No default values set</p>
                                  {/if}
                                </div>
                              </div>
                            </div>
                          {/if}
                        {/each}
                      </div>
                    {:else}
                      <div class="bg-white p-6 rounded-lg border border-dashed border-gray-300 text-center">
                        <p class="text-gray-500">All measurement types have been selected</p>
                      </div>
                    {/if}
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        <!-- Modal Footer -->
        <div class="p-4 md:p-6 border-t border-gray-200 bg-gray-50">
          <div class="flex justify-end gap-3 md:gap-4">
            <button
              type="button"
              on:click={resetForm}
              class="px-4 md:px-6 py-2.5 font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="configForm"
              class="px-6 md:px-8 py-2.5 font-medium rounded-lg border border-primary bg-primary text-white hover:bg-primary-dark transition-all duration-200 shadow-sm disabled:opacity-50 flex items-center gap-2"
              disabled={isLoading || selectedMeasurements.size === 0}
            >
              {#if isLoading}
                <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
              {/if}
              {isLoading ? "Saving..." : selectedConfig ? "Update Configuration" : "Create Configuration"}
            </button>
          </div>
          
          {#if selectedMeasurements.size === 0}
            <p class="text-red-500 text-xs mt-2 text-center">Please select at least one measurement type</p>
          {/if}
        </div>
      </div>
    </div>
  {/if}

  <!-- Delete Confirmation Modal -->
  {#if showDeleteModal}
    <div
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
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
    <div
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white p-6 rounded-lg w-full max-w-md">
        <h2 class="text-xl font-bold mb-4 text-red-600">Error</h2>
        <p class="mb-4">{errorMessage}</p>
        <div class="flex justify-end">
          <button
            class="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
            on:click={() => (showErrorModal = false)}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>
