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
      
      // Apply initial sorting
      students = students.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      students = [...students]; // Trigger reactivity
    } catch (err) {
      error = "Error loading data. Please refresh the page.";
      console.error("Error in component:", err);
    }
  });

  // State for dynamic measurements
  let selectedGender = "";
  let selectedCourseId = "";
  let requiredMeasurements = [];

  // Updated reactive statement for measurements
  $: if (selectedGender && selectedCourseId) {
    const configKey = `${selectedGender}_${selectedCourseId}`;
    const configs = uniformConfigs[configKey] || [];

    console.log("Selected config key:", configKey); // Debug log
    console.log("Found configs:", configs); // Debug log

    // Process required measurements by wear type
    const upperMeasurements = configs
      .filter((c) => c.wear_type === "upper")
      .flatMap((c) =>
        (c.measurement_specs || []).map((spec) => ({
          id: spec.measurement_type_id,
          base_cm: spec.base_cm,
        }))
      );

    const lowerMeasurements = configs
      .filter((c) => c.wear_type === "lower")
      .flatMap((c) =>
        (c.measurement_specs || []).map((spec) => ({
          id: spec.measurement_type_id,
          base_cm: spec.base_cm,
        }))
      );

    // Combine all measurements with their types and specs
    requiredMeasurements = [
      ...upperMeasurements.map((spec) => ({
        ...measurementTypes[spec.id],
        ...spec,
        wear_type: "upper",
      })),
      ...lowerMeasurements.map((spec) => ({
        ...measurementTypes[spec.id],
        ...spec,
        wear_type: "lower",
      })),
    ].filter(Boolean);

    console.log("Required measurements:", requiredMeasurements); // Debug log
  } else {
    requiredMeasurements = [];
  }

  // Sorting logic
  let sortField = "created_at";
  let sortDirection = "desc";

  function sort(field) {
    if (sortField === field) {
      sortDirection = sortDirection === "asc" ? "desc" : "asc";
    } else {
      sortField = field;
      sortDirection = "asc";
    }

    students = students.sort((a, b) => {
      let comparison = 0;
      if (field === "course") {
        comparison =
          a.course?.course_code.localeCompare(b.course?.course_code) || 0;
      } else {
        comparison = a[field] < b[field] ? -1 : a[field] > b[field] ? 1 : 0;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
    students = [...students]; // Trigger reactivity
  }

  // Modal state
  let showModal = false;
  let modalMode = "create";
  let editingStudent = {};

  function openCreateModal() {
    modalMode = "create";
    editingStudent = {};
    showModal = true;
  }

  function openEditModal(student) {
    modalMode = "edit";
    editingStudent = { ...student };
    selectedGender = student.gender;
    // Convert course_id to string when setting selectedCourseId
    selectedCourseId = student.course_id?.toString() || "";
    showModal = true;
  }

  function resetForm() {
    editingStudent = {};
    selectedGender = "";
    selectedCourseId = "";
    showModal = false;
  }

  // Search functionality
  let searchQuery = "";
  $: filteredStudents = students.filter(
    (student) =>
      student.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.course?.course_code
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  // Add these near your other state variables
  let showDeleteModal = false;
  let studentToDelete = null;
  let deleteError = null;

  function openDeleteModal(student) {
    studentToDelete = student;
    deleteError = null; // Reset error when opening modal
    showDeleteModal = true;
  }

  function resetDeleteModal() {
    studentToDelete = null;
    deleteError = null;
    showDeleteModal = false;
  }

  function handleDelete() {
    return async ({ result }) => {
      if (result.type === "success") {
        students = students.filter((s) => s.id !== studentToDelete.id);
        resetDeleteModal();
      } else {
        // Access the error message from the result data
        deleteError =
          result.data?.error || "An error occurred while deleting the student.";
        console.log("Delete error:", result); // Debug log
      }
    };
  }

  // Add validation functions
  const isValidPhoneNumber = (phone) => {
    if (!phone) return true; // Allow empty phone numbers
    const phoneRegex = /^09\d{9}$/;
    return phoneRegex.test(phone);
  };

  const isValidName = (name) => {
    const nameRegex = /^[A-Za-z\s\-']+$/;
    return nameRegex.test(name);
  };

  // Add form validation state
  let formErrors = {
    first_name: '',
    last_name: '',
    contact_number: '',
    gender: '',
    course_id: '',
    address: ''
  };


  let serverErrors = {};

  function validateField(field, value) {
    formErrors = { ...formErrors };
    
    switch (field) {
        case 'first_name':
        case 'last_name':
            if (!value) {
                formErrors[field] = 'Name is required';
            } else if (value.length < 2 || value.length > 50) {
                formErrors[field] = 'Must be between 2-50 characters';
            } else if (!/^[a-zA-Z\s.]+$/.test(value)) {
                formErrors[field] = 'Only letters, spaces, and dots allowed';
            } else {
                delete formErrors[field];
            }
            break;
        case 'contact_number':
            if (!value) {
                formErrors[field] = 'Contact number is required';
            } else if (!/^09\d{9}$/.test(value)) {
                formErrors[field] = 'Must be 11 digits starting with 09';
            } else {
                delete formErrors[field];
            }
            break;
        case 'address':
            if (!value) {
                formErrors[field] = 'Address is required';
            } else if (value.length < 5 || value.length > 200) {
                formErrors[field] = 'Must be between 5-200 characters';
            } else if (!/^[a-zA-Z0-9\s,.\-#]+$/.test(value)) {
                formErrors[field] = 'Only letters, numbers, spaces, commas, dots, hyphens, and #';
            } else {
                delete formErrors[field];
            }
            break;
        case 'gender':
          if (!value) {
            formErrors[field] = 'Please select a gender';
          } else {
            delete formErrors[field];
          }
          break;
        case 'course_id':
          if (!value) {
            formErrors[field] = 'Please select a course';
          } else {
            delete formErrors[field];
          }
          break;
    }
  }

  // Enhanced form submission
  function handleSubmit() {
    return async ({ result }) => {
      if (result.type === 'failure') {
        const serverErrors = result.data?.errors || {};
        formErrors = { ...formErrors, ...serverErrors };
      } else if (result.type === 'success') {
        showModal = false;
        window.location.reload();
      }
    };
  }

  // Add pagination state
  let currentPage = 1;
  let rowsPerPage = 10;
  
  // Calculate total pages and paginated students
  $: totalPages = Math.ceil((filteredStudents?.length || 0) / rowsPerPage);
  $: paginatedStudents = filteredStudents?.slice(
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
  $: if (searchQuery) {
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

{#if error}
  <div class="p-4 bg-red-100 text-red-700 rounded">
    {error}
  </div>
{:else}
  <div class="p-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0 mb-6">
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
        <path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4s-4 1.79-4 4s1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
      </div>
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Student Management</h1>
        <p class="text-sm text-gray-500">
            Manage student info and measurements
        </p>
      </div>
    </div>
  </div>
    </div>

    <!-- Main content card -->
    <div class="bg-white p-6 rounded-lg shadow-md">
      <div class="flex flex-col md:flex-row justify-between gap-4 md:gap-0 mb-4">
        <h2 class="text-xl font-semibold">Students List</h2>
        <div class="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            bind:value={searchQuery}
            placeholder="Search students..."
            class="w-full md:w-auto border rounded p-2"
          />
          <button
            class="w-full md:w-auto bg-primary text-white px-4 py-2 rounded-lg"
            on:click={openCreateModal}
          >
            Add Student
          </button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-muted max-md:whitespace-nowrap">
              <th
                class="p-2 cursor-pointer hover:bg-gray-200 text-left"
                on:click={() => sort("first_name")}
              >
                First Name
                {#if sortField === "first_name"}
                  <span class="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span
                  >
                {/if}
              </th>
              <th
                class="p-2 cursor-pointer hover:bg-gray-200 text-left"
                on:click={() => sort("last_name")}
              >
                Last Name
                {#if sortField === "last_name"}
                  <span class="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span
                  >
                {/if}
              </th>
              <th
                class="p-2 cursor-pointer hover:bg-gray-200 text-left"
                on:click={() => sort("course")}
              >
                Course
                {#if sortField === "course"}
                  <span class="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span
                  >
                {/if}
              </th>
              <th
                class="p-2 cursor-pointer hover:bg-gray-200 text-left"
                on:click={() => sort("gender")}
              >
                Gender
                {#if sortField === "gender"}
                  <span class="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span
                  >
                {/if}
              </th>
              <th class="p-2 text-left">Contact Number</th>
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
            {#each paginatedStudents as student}
              <tr class="border-b hover:bg-muted">
                <td class="p-2">{student.first_name}</td>
                <td class="p-2">{student.last_name}</td>
                <td class="p-2">
                  <span
                    class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {student.course?.course_code}
                  </span>
                </td>
                <td class="p-2">
                  <span
                    class="px-2 py-1 rounded-full text-sm
                                        {student.gender === 'male'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-pink-100 text-pink-800'}"
                  >
                    {student.gender}
                  </span>
                </td>
                <td class="p-2">{student.contact_number || "-"}</td>
                <td class="p-2">{new Date(student.created_at).toLocaleDateString()}</td>
                <td class="p-2 text-right">
                  <button
                    class="text-blue-600 hover:text-blue-800 mr-2"
                    on:click={() => openEditModal(student)}
                  >
                    Edit
                  </button>
                  <button
                    class="text-red-600 hover:text-red-800"
                    on:click={() => openDeleteModal(student)}
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
            Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, filteredStudents?.length || 0)} of {filteredStudents?.length || 0} entries
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
{/if}

{#if showModal}
  <div
    class="fixed inset-0 bg-black/70 flex items-center justify-center overflow-y-auto py-4 z-50"
  >
    <div
      class="bg-white rounded-xl w-full max-w-4xl mx-4 my-8 shadow-2xl animate-scale"
    >
      <!-- Modal Header -->
      <div
        class="bg-gradient-to-r from-primary to-primary-dark px-8 py-5 rounded-t-xl"
      >
        <h2 class="text-2xl font-bold text-white">
          {modalMode === "create"
            ? "Add New Student"
            : "Edit Student Information"}
        </h2>
      </div>

      <!-- Modal Body -->
      <div class="p-8 max-h-[calc(100vh-200px)] overflow-y-auto">
        <form
          id="studentForm"
          method="POST"
          action="?/{modalMode}"
          use:enhance={handleSubmit}
          on:submit={handleSubmit}
          class="space-y-8"
        >
          {#if modalMode === "edit"}
            <input type="hidden" name="id" value={editingStudent.id} />
          {/if}

          <!-- Show form-level errors if any -->
          {#if formErrors._form || serverErrors._form}
            <div class="p-4 bg-red-50 text-red-600 rounded-lg">
                {formErrors._form || serverErrors._form}
            </div>
          {/if}

          <!-- Personal Information Section -->
          <div class="space-y-6">
            <h3 class="text-xl font-semibold text-primary border-b pb-2">
              Personal Information
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700"
                  >First Name</label
                >
                <input
                  type="text"
                  name="first_name"
                  value={editingStudent.first_name || ""}
                  class="w-full p-3 border rounded-lg focus:ring-2 {formErrors.first_name ? 'border-red-500' : 'border-gray-300'}"
                  on:input={(e) => validateField('first_name', e.target.value)}
                  required
                />
                {#if formErrors.first_name || serverErrors.first_name}
                  <p class="text-red-500 text-sm mt-1">
                    {formErrors.first_name || serverErrors.first_name}
                  </p>
                {/if}
              </div>

              <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700"
                  >Last Name</label
                >
                <input
                  type="text"
                  name="last_name"
                  value={editingStudent.last_name || ""}
                  class="w-full p-3 border rounded-lg focus:ring-2 {formErrors.last_name ? 'border-red-500' : 'border-gray-300'}"
                  on:input={(e) => validateField('last_name', e.target.value)}
                  required
                />
                {#if formErrors.last_name || serverErrors.last_name}
                  <p class="text-red-500 text-sm mt-1">
                    {formErrors.last_name || serverErrors.last_name}
                  </p>
                {/if}
              </div>

              <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700">Gender</label>
                <select
                  name="gender"
                  bind:value={selectedGender}
                  class="w-full p-3 border rounded-lg focus:ring-2 {formErrors.gender ? 'border-red-500' : 'border-gray-300'}"
                  on:change={(e) => validateField('gender', e.target.value)}
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
                {#if formErrors.gender}
                  <p class="text-red-500 text-sm mt-1">{formErrors.gender}</p>
                {/if}
              </div>

              <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700">Course</label>
                <select
                  name="course_id"
                  bind:value={selectedCourseId}
                  class="w-full p-3 border rounded-lg focus:ring-2 {formErrors.course_id ? 'border-red-500' : 'border-gray-300'}"
                  on:change={(e) => validateField('course_id', e.target.value)}
                  required
                >
                  <option value="">Select Course</option>
                  {#each courses as course}
                    <option value={course.id.toString()}>
                      {course.course_code} - {course.description}
                    </option>
                  {/each}
                </select>
                {#if formErrors.course_id}
                  <p class="text-red-500 text-sm mt-1">{formErrors.course_id}</p>
                {/if}
              </div>

              <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700"
                  >Contact Number</label
                >
                <input
                  type="text"
                  name="contact_number"
                  value={editingStudent.contact_number || ""}
                  class="w-full p-3 border rounded-lg focus:ring-2 {formErrors.contact_number ? 'border-red-500' : 'border-gray-300'}"
                  on:input={(e) => validateField('contact_number', e.target.value)}
                  placeholder="09XXXXXXXXX"
                />
                {#if formErrors.contact_number || serverErrors.contact_number}
                  <p class="text-red-500 text-sm mt-1">
                    {formErrors.contact_number || serverErrors.contact_number}
                  </p>
                {/if}
              </div>

              <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700">Address</label>
                <textarea
                  name="address"
                  value={editingStudent.address || ""}
                  class="w-full p-3 border rounded-lg focus:ring-2 {formErrors.address ? 'border-red-500' : 'border-gray-300'}"
                  on:input={(e) => validateField('address', e.target.value)}
                  rows="2"
                ></textarea>
                {#if formErrors.address}
                  <p class="text-red-500 text-sm mt-1">{formErrors.address}</p>
                {/if}
              </div>
            </div>
          </div>

          <!-- Measurements Section -->
          {#if requiredMeasurements.length > 0}
            <div class="space-y-6">
              <h3 class="text-xl font-semibold text-primary border-b pb-2">
                Required Measurements
              </h3>

              <!-- Upper Wear Measurements -->
              {#if requiredMeasurements.some((m) => m.wear_type === "upper")}
                <div
                  class="bg-gray-50/50 p-6 rounded-xl border border-gray-100"
                >
                  <h4
                    class="font-semibold text-lg mb-6 text-primary flex items-center gap-2"
                  >
                    Upper Wear Measurements
                  </h4>
                  <div
                    class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    {#each requiredMeasurements.filter((m) => m.wear_type === "upper") as measurement}
                      <div class="measurement-input-group space-y-2">
                        <label class="block text-sm font-medium text-gray-700">
                          {measurement.name}
                        </label>
                        <div class="relative">
                          <input
                            type="number"
                            step="0.1"
                            name="measurement_{measurement.id}"
                            value={editingStudent?.measurements?.[
                              measurement.id
                            ] || ""}
                            class="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                            placeholder="Base: {measurement.base_cm}cm"
                          />
                          <span
                            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm"
                            >cm</span
                          >
                        </div>
                      </div>
                    {/each}
                  </div>
                </div>
              {/if}

              <!-- Lower Wear Measurements -->
              {#if requiredMeasurements.some((m) => m.wear_type === "lower")}
                <div
                  class="bg-gray-50/50 p-6 rounded-xl border border-gray-100"
                >
                  <h4
                    class="font-semibold text-lg mb-6 text-primary flex items-center gap-2"
                  >
                    Lower Wear Measurements
                  </h4>
                  <div
                    class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    {#each requiredMeasurements.filter((m) => m.wear_type === "lower") as measurement}
                      <div class="measurement-input-group space-y-2">
                        <label class="block text-sm font-medium text-gray-700">
                          {measurement.name}
                        </label>
                        <div class="relative">
                          <input
                            type="number"
                            step="0.1"
                            name="measurement_{measurement.id}"
                            value={editingStudent?.measurements?.[
                              measurement.id
                            ] || ""}
                            class="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                            placeholder="Base: {measurement.base_cm}cm"
                          />
                          <span
                            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm"
                            >cm</span
                          >
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
      <div class="border-t px-8 py-5 bg-gray-50/50 rounded-b-xl">
        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors duration-200 font-medium"
            on:click={resetForm}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="studentForm"
            class="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors duration-200 font-medium"
          >
            {modalMode === "create" ? "Create Student" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

{#if showDeleteModal}
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
  >
    <div class="bg-white p-6 rounded-lg w-full max-w-md">
      <h2 class="text-xl font-bold mb-4 text-red-600">Confirm Delete</h2>
      <p class="mb-4">
        Are you sure you want to delete student:
        <span class="font-semibold">
          {studentToDelete?.first_name}
          {studentToDelete?.last_name}
        </span>?
      </p>

      {#if deleteError}
        <div
          class="mb-4 p-3 bg-red-50 text-red-700 rounded border border-red-200"
        >
          {deleteError}
        </div>
      {/if}

      <div class="flex justify-end gap-2">
        <button
          class="px-4 py-2 text-gray-600 hover:text-gray-800"
          on:click={resetDeleteModal}
        >
          {deleteError ? "Close" : "Cancel"}
        </button>
        {#if !deleteError}
          <form
            method="POST"
            action="?/delete"
            use:enhance={handleDelete}
            class="inline"
          >
            <input type="hidden" name="id" value={studentToDelete?.id} />
            <button
              type="submit"
              class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Delete
            </button>
          </form>
        {/if}
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

  .measurement-input-group input[type="number"] {
    -moz-appearance: textfield;
  }
</style>
