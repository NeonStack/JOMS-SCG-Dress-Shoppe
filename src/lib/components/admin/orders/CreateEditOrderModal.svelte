<script>
  import { enhance } from "$app/forms";
  import { createEventDispatcher } from "svelte";
  import { onMount } from "svelte";

  export let isEditing = false;
  export let orderToEdit = null;
  export let students = [];
  export let uniformConfigs = [];
  export let isLoading = false;

  let selectedStudent = orderToEdit ? students.find(s => s.id === orderToEdit.student.id) : null;
  let selectedUniformType = orderToEdit ? orderToEdit.uniform_type : "upper";
  let selectedDueDate = orderToEdit ? orderToEdit.due_date : "";
  let searchTerm = orderToEdit ? `${orderToEdit.student.first_name} ${orderToEdit.student.last_name} (${orderToEdit.student.course?.course_code})` : "";
  let isStudentDropdownOpen = false;
  let minDueDate = ""; // Will be set in onMount

  // Calculate tomorrow's date with proper timezone handling
  onMount(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    // Format to YYYY-MM-DD in local timezone
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    minDueDate = `${year}-${month}-${day}`;
    
    // Set selected due date to tomorrow if not editing and no date is selected
    if (!isEditing && !selectedDueDate) {
        selectedDueDate = minDueDate;
    }
  });

  // For price calculation
  $: availableUniformTypes = selectedStudent
    ? getAvailableUniformTypes(selectedStudent, uniformConfigs)
    : [];

  $: totalAmount = calculateTotalAmount(selectedStudent, selectedUniformType);

  $: priceBreakdown = getPriceBreakdown(
    selectedStudent,
    selectedUniformType,
    uniformConfigs
  );

  $: selectedUniformConfig =
    selectedStudent && selectedUniformType
      ? uniformConfigs.find(
          (c) =>
            c.course_id === selectedStudent.course_id &&
            c.gender === selectedStudent.gender &&
            c.wear_type === selectedUniformType
        )
      : null;

  // Enhanced search that also searches by student ID
  $: filteredStudents = students.filter((student) => {
    const searchContent = `${student.id} ${student.first_name} ${student.last_name} ${student.course?.course_code}`.toLowerCase();
    return searchContent.includes(searchTerm.toLowerCase());
  });

  $: if (selectedStudent && availableUniformTypes.length === 1) {
    selectedUniformType = availableUniformTypes[0];
  }

  const dispatch = createEventDispatcher();

  function getAvailableUniformTypes(student, configs) {
    const studentConfigs = configs.filter(
      (c) => c.course_id === student.course_id && c.gender === student.gender
    );

    const types = [];
    const hasUpper = studentConfigs.some((c) => c.wear_type === "upper");
    const hasLower = studentConfigs.some((c) => c.wear_type === "lower");

    if (hasUpper) types.push("upper");
    if (hasLower) types.push("lower");
    if (hasUpper && hasLower) types.push("both");

    // Set default selected type if current selection is not available
    if (!types.includes(selectedUniformType)) {
      selectedUniformType = types[0] || "";
    }

    return types;
  }

  function calculateTotalAmount(student, uniformType) {
    if (!student || !uniformType) return 0;

    const configs = uniformConfigs.filter(
      (c) => c.course_id === student.course_id && c.gender === student.gender
    );

    if (!configs.length) return 0;

    let totalAmount = 0;

    if (uniformType === "both") {
      const upperConfig = configs.find((c) => c.wear_type === "upper");
      const lowerConfig = configs.find((c) => c.wear_type === "lower");

      if (upperConfig) {
        totalAmount += calculatePriceForConfig(
          upperConfig,
          student.measurements
        );
      }
      if (lowerConfig) {
        totalAmount += calculatePriceForConfig(
          lowerConfig,
          student.measurements
        );
      }
    } else {
      const config = configs.find((c) => c.wear_type === uniformType);
      if (config) {
        totalAmount = calculatePriceForConfig(config, student.measurements);
      }
    }

    return totalAmount;
  }

  function calculatePriceForConfig(config, measurements) {
    let price = config.base_price;

    // Add additional costs based on measurements
    if (config.measurement_specs && measurements) {
      config.measurement_specs.forEach((spec) => {
        const studentMeasurement = measurements[spec.measurement_type_id];
        if (studentMeasurement && studentMeasurement > spec.base_cm) {
          const exceededCm = Math.ceil(studentMeasurement - spec.base_cm);
          const additionalCost = exceededCm * spec.additional_cost_per_cm;
          price += additionalCost;
        }
      });
    }

    return price;
  }

  function getPriceBreakdown(student, uniformType, configs) {
    if (!student || !uniformType) return [];

    const breakdown = [];
    const studentConfigs = configs.filter(
      (c) => c.course_id === student.course_id && c.gender === student.gender
    );

    if (uniformType === "both") {
      const upperConfig = studentConfigs.find((c) => c.wear_type === "upper");
      const lowerConfig = studentConfigs.find((c) => c.wear_type === "lower");

      if (upperConfig) {
        breakdown.push(
          ...getConfigBreakdown(upperConfig, student.measurements, "Upper Wear")
        );
      }
      if (lowerConfig) {
        breakdown.push(
          ...getConfigBreakdown(lowerConfig, student.measurements, "Lower Wear")
        );
      }
    } else {
      const config = studentConfigs.find((c) => c.wear_type === uniformType);
      if (config) {
        breakdown.push(
          ...getConfigBreakdown(
            config,
            student.measurements,
            uniformType === "upper" ? "Upper Wear" : "Lower Wear"
          )
        );
      }
    }

    return breakdown;
  }

  function getConfigBreakdown(config, measurements, wearType) {
    const breakdown = [
      {
        description: `${wearType} Base Price`,
        amount: config.base_price,
      },
    ];

    if (config.measurement_specs && measurements) {
      config.measurement_specs.forEach((spec) => {
        const studentMeasurement = measurements[spec.measurement_type_id];
        if (studentMeasurement && studentMeasurement > spec.base_cm) {
          const exceededCm = Math.ceil(studentMeasurement - spec.base_cm);
          const additionalCost = exceededCm * spec.additional_cost_per_cm;
          if (additionalCost > 0) {
            breakdown.push({
              description: `Additional cost for exceeding ${spec.base_cm}cm by ${exceededCm}cm (₱${spec.additional_cost_per_cm}/cm)`,
              amount: additionalCost,
            });
          }
        }
      });
    }

    return breakdown;
  }

  function closeModal() {
    dispatch("close");
  }

  const handleSubmit = () => {
    return async ({ result }) => {
      if (result.type === "success") {
        dispatch("success", { action: isEditing ? "edit" : "create" });
      }
    };
  };
</script>

<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
  <div class="bg-white rounded-xl shadow-xl w-[90%] max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
    <!-- Header with improved styling -->
    <div class="bg-gradient-to-r from-primary to-primary-dark p-6 flex justify-between items-center">
      <h2 class="text-2xl font-bold text-white">
        {isEditing ? "Edit Order" : "Create New Order"}
      </h2>
      <button 
        on:click={closeModal} 
        class="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
        aria-label="Close"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Scrollable content area -->
    <div class="flex-1 overflow-auto p-6">
      <form
        method="POST"
        action={isEditing ? "?/editOrder" : "?/createOrder"}
        use:enhance={handleSubmit}
        class="space-y-6"
      >
        {#if isEditing}
          <input type="hidden" name="orderId" value={orderToEdit.id} />
        {/if}

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <!-- Left Column - Order Details -->
          <div class="space-y-6">
            <div class="bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 class="text-lg font-semibold mb-4 text-primary flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                </svg>
                Order Information
              </h3>
              <div class="space-y-5">
                <!-- Student Selection with improved styling and ID display -->
                <div>
                  <label class="block mb-2 font-medium text-gray-700">Customer *</label>
                  <div class="relative">
                    <div class="flex items-center relative">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 absolute left-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="text"
                        bind:value={searchTerm}
                        placeholder="Search by ID, name, or course..."
                        class="studentSearch w-full pl-10 p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all {selectedStudent ? 'bg-gray-50' : ''}"
                        readonly={selectedStudent}
                        on:focus={() => {
                          if (selectedStudent) {
                            selectedStudent = null;
                            searchTerm = "";
                          }
                          isStudentDropdownOpen = true;
                        }}
                      />
                    </div>
                    {#if isStudentDropdownOpen && !selectedStudent}
                      <div
                        class="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-xl max-h-60 overflow-y-auto"
                      >
                        {#if filteredStudents.length > 0}
                          {#each filteredStudents as student}
                            <div
                              class="p-4 hover:bg-gray-50 cursor-pointer border-b last:border-0 transition-colors"
                              on:click={() => {
                                selectedStudent = student;
                                searchTerm = `${student.first_name} ${student.last_name} (${student.course?.course_code})`;
                                isStudentDropdownOpen = false;
                              }}
                            >
                              <div class="flex flex-col">
                                <div class="flex justify-between">
                                  <span class="font-semibold text-gray-900">
                                    {student.first_name} {student.last_name}
                                  </span>
                                  <span class="text-sm text-primary font-mono">ID: {student.id}</span>
                                </div>
                                <div class="text-sm text-gray-600 mt-1 flex items-center gap-2">
                                  <span class="inline-block bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-medium">
                                    {student.course?.course_code}
                                  </span>
                                  <span class="capitalize px-2 py-0.5 bg-gray-100 rounded-full text-xs font-medium">
                                    {student.gender}
                                  </span>
                                </div>
                              </div>
                            </div>
                          {/each}
                        {:else}
                          <p class="text-gray-500 text-center p-4">No students found</p>
                        {/if}
                      </div>
                    {/if}
                  </div>
                  <input type="hidden" name="studentId" value={selectedStudent?.id} required />
                  {#if selectedStudent}
                    <p class="text-xs text-gray-500 mt-1 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                      </svg>
                      Selected student ID: {selectedStudent.id}
                    </p>
                  {/if}
                </div>

                <!-- Uniform Type -->
                <div>
                  <label class="block mb-2 font-medium text-gray-700">Uniform Type *</label>
                  <div class="relative">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 absolute left-3 top-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <select
                      name="uniformType"
                      bind:value={selectedUniformType}
                      class="w-full pl-10 p-3 border rounded-lg appearance-none bg-no-repeat focus:ring-2 focus:ring-primary focus:border-primary transition-all pr-10"
                      required
                    >
                      <option value="">Select uniform type</option>
                      {#each availableUniformTypes as type}
                        <option value={type}>
                          {type === "upper" ? "Upper Wear" : type === "lower" ? "Lower Wear" : "Both"}
                        </option>
                      {/each}
                    </select>
                  </div>
                </div>

                <!-- Due Date -->
                <div>
                  <label class="block mb-2 font-medium text-gray-700">Due Date *</label>
                  <div class="relative">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 absolute left-3 top-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <input
                      type="date"
                      name="dueDate"
                      bind:value={selectedDueDate}
                      min={minDueDate}
                      class="w-full pl-10 p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      required
                    />
                  </div>
                  {#if minDueDate}
                    <p class="text-xs text-gray-500 mt-1 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                      </svg>
                      Must be at least tomorrow ({minDueDate})
                    </p>
                  {/if}
                </div>
              </div>
            </div>

            {#if selectedStudent}
              <div class="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200 shadow-sm">
                <h3 class="text-lg font-semibold mb-4 text-blue-700 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                  </svg>
                  Student Details
                </h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div class="p-3 bg-white rounded-lg border border-blue-200">
                    <span class="text-gray-500 text-sm">ID</span>
                    <p class="font-mono font-medium text-blue-900">{selectedStudent.id}</p>
                  </div>
                  <div class="p-3 bg-white rounded-lg border border-blue-200">
                    <span class="text-gray-500 text-sm">Name</span>
                    <p class="font-medium text-blue-900">{selectedStudent.first_name} {selectedStudent.last_name}</p>
                  </div>
                  <div class="p-3 bg-white rounded-lg border border-blue-200">
                    <span class="text-gray-500 text-sm">Course</span>
                    <p class="font-medium text-blue-900">{selectedStudent.course?.course_code}</p>
                  </div>
                  <div class="p-3 bg-white rounded-lg border border-blue-200">
                    <span class="text-gray-500 text-sm">Gender</span>
                    <p class="font-medium text-blue-900 capitalize">{selectedStudent.gender}</p>
                  </div>
                </div>
              </div>
            {/if}
          </div>

          <!-- Right Column - Price Breakdown -->
          <div class="bg-gradient-to-r from-gray-50 to-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 class="text-lg font-semibold mb-4 text-primary flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
              </svg>
              Price Breakdown
            </h3>

            {#if priceBreakdown.length > 0}
              <div class="space-y-4">
                <div class="divide-y divide-gray-200">
                  {#each priceBreakdown as item}
                    <div class="py-3 flex justify-between items-center">
                      <span class="text-gray-600">{item.description}</span>
                      <span class="font-medium">₱{item.amount.toFixed(2)}</span>
                    </div>
                  {/each}
                </div>

                <div class="border-t-2 border-primary pt-4 mt-4">
                  <div class="flex justify-between items-center text-lg font-bold">
                    <span>Total Amount</span>
                    <span class="text-primary text-xl">₱{totalAmount.toFixed(2)}</span>
                  </div>
                </div>
                
                <!-- Payment note -->
                <div class="mt-6 bg-amber-50 p-4 rounded-lg border border-amber-100">
                  <p class="text-sm text-amber-700 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                    </svg>
                    Payment can be managed after order creation in the Payments tab.
                  </p>
                </div>
              </div>
            {:else}
              <div class="flex flex-col items-center justify-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p class="text-gray-500 text-center mb-2">
                  Select a student and uniform type
                </p>
                <p class="text-gray-400 text-sm text-center">
                  Price breakdown will appear here
                </p>
              </div>
            {/if}

            <input type="hidden" name="totalAmount" value={totalAmount} />
            <input type="hidden" name="uniformConfigId" value={selectedUniformConfig?.id} />
          </div>
        </div>
      </form>
    </div>

    <!-- Footer with buttons -->
    <div class="border-t bg-gray-50 p-6 flex justify-end gap-3">
      <button
        type="button"
        class="px-6 py-3 border rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
        on:click={closeModal}
      >
        Cancel
      </button>
      <button
        type="submit"
        form="orderForm"
        class="px-6 py-3 rounded-lg transition-colors flex items-center gap-2
          {selectedStudent && selectedUniformType && selectedDueDate
            ? 'bg-primary text-white hover:bg-primary-dark'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
          {isLoading ? 'opacity-50 cursor-not-allowed' : ''}"
        disabled={!selectedStudent || !selectedUniformType || !selectedDueDate || isLoading}
      >
        {#if isLoading}
          <div class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
        {/if}
        {isEditing ? "Save Changes" : "Create Order"}
      </button>
    </div>
  </div>
</div>
