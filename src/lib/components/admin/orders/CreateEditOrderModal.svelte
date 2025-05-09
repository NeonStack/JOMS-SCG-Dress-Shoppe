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
    
    console.log("Minimum due date set to:", minDueDate);
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

  $: filteredStudents = students.filter((student) =>
    `${student.first_name} ${student.last_name} ${student.course?.course_code}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

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
  <div class="bg-white p-6 rounded-lg w-[80%] max-w-5xl max-h-[95vh] overflow-auto">
    <div class="flex justify-between mb-6">
      <h2 class="text-2xl font-bold">
        {isEditing ? "Edit Order" : "Create New Order"}
      </h2>
      <button on:click={closeModal} class="text-gray-500 text-xl">&times;</button>
    </div>

    <form
      method="POST"
      action={isEditing ? "?/editOrder" : "?/createOrder"}
      use:enhance={handleSubmit}
      class="space-y-4"
    >
      {#if isEditing}
        <input type="hidden" name="orderId" value={orderToEdit.id} />
      {/if}

      <div class="grid grid-cols-2 gap-8">
        <!-- Left Column - Order Details -->
        <div class="space-y-6">
          <div class="bg-gray-50 p-6 rounded-lg">
            <h3 class="text-lg font-semibold mb-4 text-primary">
              Order Information
            </h3>
            <div class="space-y-4">
              <!-- Student Selection -->
              <div>
                <label class="block mb-2 font-medium">Customer *</label>
                <div class="relative">
                  <input
                    type="text"
                    bind:value={searchTerm}
                    placeholder="Click to search customers..."
                    class="studentSearch w-full p-2 border rounded {selectedStudent
                      ? 'bg-gray-50'
                      : ''}"
                    readonly={selectedStudent}
                    on:focus={() => {
                      if (selectedStudent) {
                        selectedStudent = null;
                        searchTerm = "";
                      }
                      isStudentDropdownOpen = true;
                    }}
                  />
                  {#if isStudentDropdownOpen && !selectedStudent}
                    <div
                      class="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto"
                    >
                      {#if filteredStudents.length > 0}
                        {#each filteredStudents as student}
                          <div
                            class="p-3 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                            on:click={() => {
                              selectedStudent = student;
                              searchTerm = `${student.first_name} ${student.last_name} (${student.course?.course_code})`;
                              isStudentDropdownOpen = false;
                            }}
                          >
                            <div>
                              <div class="font-semibold">
                                {student.first_name} {student.last_name}
                              </div>
                              <div class="text-sm text-gray-600">
                                <span class="inline-block bg-gray-100 px-2 py-0.5 rounded">
                                  {student.course?.course_code}
                                </span>
                                <span class="ml-2 capitalize">{student.gender}</span>
                              </div>
                            </div>
                            <div class="text-gray-400">
                              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M7.293 14.707a 1 1 0 010-1.414L10.586 10 7.293 6.707a 1 1 0 011.414-1.414l4 4a 1 1 0 010 1.414l-4 4a 1 1 0 01-1.414 0z" clip-rule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        {/each}
                      {:else}
                        <p class="text-gray-500 text-center p-3">No students found</p>
                      {/if}
                    </div>
                  {/if}
                </div>
                <input type="hidden" name="studentId" value={selectedStudent?.id} required />
              </div>

              <!-- Uniform Type -->
              <div>
                <label class="block mb-2 font-medium">Uniform Type *</label>
                <select
                  name="uniformType"
                  bind:value={selectedUniformType}
                  class="w-full p-2 border rounded"
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

              <!-- Due Date -->
              <div>
                <label class="block mb-2 font-medium">Due Date *</label>
                <input
                  type="date"
                  name="dueDate"
                  bind:value={selectedDueDate}
                  min={minDueDate}
                  class="w-full p-2 border rounded"
                  required
                />
                {#if minDueDate}
                  <p class="text-xs text-gray-500 mt-1">Must be at least tomorrow ({minDueDate})</p>
                {/if}
              </div>
            </div>
          </div>

          {#if selectedStudent}
            <div class="bg-gray-50 p-6 rounded-lg">
              <h3 class="text-lg font-semibold mb-4 text-primary">Student Details</h3>
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span class="text-gray-600">Course:</span>
                  <p class="font-medium">{selectedStudent.course?.course_code}</p>
                </div>
                <div>
                  <span class="text-gray-600">Gender:</span>
                  <p class="font-medium capitalize">{selectedStudent.gender}</p>
                </div>
              </div>
            </div>
          {/if}
        </div>

        <!-- Right Column - Price Breakdown -->
        <div class="bg-gray-50 p-6 rounded-lg">
          <h3 class="text-lg font-semibold mb-4 text-primary">Price Breakdown</h3>

          {#if priceBreakdown.length > 0}
            <div class="space-y-4">
              <div class="divide-y">
                {#each priceBreakdown as item}
                  <div class="py-3 flex justify-between items-center">
                    <span class="text-gray-600">{item.description}</span>
                    <span class="font-medium">₱{item.amount}</span>
                  </div>
                {/each}
              </div>

              <div class="border-t-2 border-primary pt-4 mt-4">
                <div class="flex justify-between items-center text-lg font-bold">
                  <span>Total Amount</span>
                  <span class="text-primary">₱{totalAmount}</span>
                </div>
              </div>
            </div>
          {:else}
            <p class="text-gray-500 text-center py-8">
              Select a student and uniform type to see the price breakdown
            </p>
          {/if}

          <input type="hidden" name="totalAmount" value={totalAmount} />
          <input type="hidden" name="uniformConfigId" value={selectedUniformConfig?.id} />
        </div>
      </div>

      <!-- Footer with buttons -->
      <div class="border-t pt-6 mt-6 flex justify-end gap-3">
        <button
          type="button"
          class="px-6 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
          on:click={closeModal}
        >
          Cancel
        </button>
        <button
          type="submit"
          class="px-6 py-2 rounded-lg transition-colors flex items-center gap-2
            {selectedStudent && selectedUniformType && selectedDueDate
            ? 'bg-primary text-white hover:bg-primary-dark'
            : 'bg-gray-400 text-gray-700 cursor-not-allowed'}
            {isLoading ? 'opacity-50 cursor-not-allowed' : ''}"
          disabled={!selectedStudent || !selectedUniformType || !selectedDueDate || isLoading}
        >
          {#if isLoading}
            <div class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
          {/if}
          {isEditing ? "Save Changes" : "Create Order"}
        </button>
      </div>
    </form>
  </div>
</div>
