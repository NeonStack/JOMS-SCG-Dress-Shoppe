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

  // Initialize selected measurements when editing
  $: if (selectedConfig) {
    // Convert measurement_specs array to Set of measurement_type_ids
    selectedMeasurements = new Set(
      selectedConfig.measurement_specs?.map(
        (spec) => spec.measurement_type_id
      ) || []
    );
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
      class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-2 md:p-4"
    >
      <div
        class="bg-gradient-to-br from-white via-gray-50 to-muted rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-[0_0_50px_rgba(183,50,51,0.15)] border border-white/50 overflow-hidden animate-scale"
      >
        <!-- Modal Header -->
        <div
          class="p-4 md:p-6 bg-gradient-to-r from-primary to-primary-dark border-b border-primary/10"
        >
          <h2 class="text-xl md:text-2xl font-bold text-white">
            {selectedConfig ? "Edit Configuration" : "New Configuration"}
          </h2>
          <p class="text-sm md:text-base text-muted mt-2">
            Configure uniform specifications and measurements
          </p>
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
                class="w-full md:w-1/3 p-4 md:p-6 max-h-[30vh] md:max-h-[calc(90vh-8rem)] overflow-y-auto border-b md:border-b-0 md:border-r border-primary/10"
              >
                <div
                  class="bg-white/80 p-4 md:p-6 rounded-xl border border-primary/10 shadow-sm"
                >
                  <h3
                    class="text-base md:text-lg font-semibold text-primary mb-4"
                  >
                    Basic Information
                  </h3>
                  <div class="space-y-4">
                    <div>
                      <label
                        class="block text-sm font-medium text-gray-600 mb-1"
                        for="courseId">Course</label
                      >
                      <select
                        name="courseId"
                        bind:value={selectedCourseId}
                        on:change={() => {
                          selectedGender = "";
                          selectedWearType = "";
                        }}
                        class="block w-full px-3 py-2 rounded-lg border border-gray-200 bg-white/50 focus:border-primary/30 focus:ring-2 focus:ring-primary/10"
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
                      {#if selectedConfig}
                        <input
                          type="hidden"
                          name="courseId"
                          value={selectedCourseId}
                        />
                      {/if}
                    </div>
                    <div>
                      <label
                        class="block text-sm font-medium text-gray-600 mb-1"
                        for="gender">Gender</label
                      >
                      <select
                        name="gender"
                        bind:value={selectedGender}
                        on:change={() => (selectedWearType = "")}
                        class="block w-full px-3 py-2 rounded-lg border border-gray-200 bg-white/50 focus:border-primary/30 focus:ring-2 focus:ring-primary/10"
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
                      {#if selectedConfig}
                        <input
                          type="hidden"
                          name="gender"
                          value={selectedGender}
                        />
                      {/if}
                    </div>
                    <div>
                      <label
                        class="block text-sm font-medium text-gray-600 mb-1"
                        for="wearType">Wear Type</label
                      >
                      <select
                        name="wearType"
                        bind:value={selectedWearType}
                        class="block w-full px-3 py-2 rounded-lg border border-gray-200 bg-white/50 focus:border-primary/30 focus:ring-2 focus:ring-primary/10"
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
                      {#if selectedConfig}
                        <input
                          type="hidden"
                          name="wearType"
                          value={selectedWearType}
                        />
                      {/if}
                    </div>
                    <div>
                      <label
                        class="block text-sm font-medium text-gray-600 mb-1"
                        for="basePrice">Base Price (₱)</label
                      >
                      <input
                        type="number"
                        name="basePrice"
                        step="0.01"
                        value={selectedConfig?.base_price || ""}
                        class="block w-full px-3 py-2 rounded-lg border border-gray-200 bg-white/50 focus:border-primary/30 focus:ring-2 focus:ring-primary/10"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Right Column - Measurements -->
              <div class="w-full md:w-2/3 p-4 md:p-6 flex-1 overflow-y-auto">
                <div
                  class="bg-white/80 p-4 md:p-6 rounded-xl border border-primary/10 shadow-sm space-y-4 md:space-y-6"
                >
                  <h3 class="text-base md:text-lg font-semibold text-primary">
                    Measurement Specifications
                  </h3>

                  <!-- Selected Measurements -->
                  {#if selectedMeasurements.size > 0}
                    <div>
                      <h4
                        class="text-xs md:text-sm font-medium text-primary/70 mb-3"
                      >
                        Selected Measurements
                      </h4>
                      <div
                        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3"
                      >
                        {#each measurementTypes as measurementType}
                          {#if selectedMeasurements.has(measurementType.id)}
                            {@const spec =
                              selectedConfig?.measurement_specs?.find(
                                (s) =>
                                  s.measurement_type_id === measurementType.id
                              )}
                            <div
                              class="group"
                              on:click|preventDefault={() =>
                                toggleMeasurement(measurementType.id)}
                            >
                              <div
                                class="bg-primary/5 p-3 rounded-lg border border-primary/20 shadow-sm cursor-pointer group-hover:border-primary/50 group-hover:shadow-md transition-all duration-200"
                              >
                                <div
                                  class="flex items-center justify-between p-2"
                                >
                                  <span class="font-medium text-primary"
                                    >{measurementType.name}</span
                                  >
                                  <input
                                    type="checkbox"
                                    name="selectedMeasurements"
                                    value={measurementType.id}
                                    checked={true}
    
                                    class="w-4 h-4 rounded-md border-gray-300 text-primary focus:ring-primary pointer-events-none"
                                  />
                                </div>
                                <!-- Stop propagation for input fields to allow interaction -->
                                <div
                                  class="space-y-2 mt-2"
                                  on:click|stopPropagation
                                >
                                  <div>
                                    <label class="block text-xs text-gray-600"
                                      >Base (cm)</label
                                    >
                                    <input
                                      type="number"
                                      name="baseCm_{measurementType.id}"
                                      value={spec?.base_cm ?? 0}
                                      class="block w-full px-2 py-1 text-sm rounded-md border border-gray-200 bg-white/50"
                                      min="0"
                                      max="500"
                                      step="0.1"
                                      required
                                    />
                                  </div>
                                  <div>
                                    <label class="block text-xs text-gray-600"
                                      >Cost per extra cm (₱)</label
                                    >
                                    <input
                                      type="number"
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
                    <h4
                      class="text-xs md:text-sm font-medium text-gray-500 mb-3"
                    >
                      Available Measurements
                    </h4>
                    <div
                      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3"
                    >
                      {#each measurementTypes as measurementType}
                        {#if !selectedMeasurements.has(measurementType.id)}
                          <div
                            class="group"
                            on:click|preventDefault={() =>
                              toggleMeasurement(measurementType.id)}
                          >
                            <div
                              class="bg-white/90 p-3 rounded-lg border border-gray-100 hover:border-primary/20 hover:shadow-sm cursor-pointer transition-all duration-200"
                            >
                              <div
                                class="flex items-center justify-between p-2"
                              >
                                <span
                                  class="font-medium text-gray-600 group-hover:text-primary"
                                  >{measurementType.name}</span
                                >
                                <input
                                  type="checkbox"
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
        <div
          class="p-4 md:p-6 border-t border-primary/5 bg-gradient-to-b from-transparent to-white/80"
        >
          <div class="flex justify-end gap-3 md:gap-4">
            <button
              type="button"
              on:click={resetForm}
              class="px-4 md:px-6 py-2 text-sm md:text-base text-gray-600 hover:text-primary font-medium rounded-lg hover:bg-primary/5 transition-all duration-300"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="configForm"
              class="px-6 md:px-8 py-2 text-sm md:text-base bg-gradient-to-r from-primary to-primary-dark text-white rounded-lg hover:scale-105 disabled:opacity-50 font-medium shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : selectedConfig ? "Update" : "Create"}
            </button>
          </div>
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
