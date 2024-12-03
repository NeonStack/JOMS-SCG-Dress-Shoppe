<script>
  import { enhance } from "$app/forms";
  import { format } from "date-fns";
  import { invalidate } from "$app/navigation";
  import { browser } from "$app/environment";

  export let data;
  let showModal = false;
  let showCreateModal = false;
  let searchTerm = "";
  let selectedStudent = null;
  let selectedUniformType = "upper";
  let selectedDueDate = "";
  let selectedOrders = [];
  let selectedEmployee = null;
  let dateRange = { start: "", end: "" };
  let sortField = "created_at";
  let sortDirection = "desc";
  let activeTab = "pending";
  let selectAll = false;
  let filteredResults = null;
  let orderToDelete = null;
  let isEditing = false;
  let orderToEdit = null;
  let orderToPayment = null;
  let paymentAmount = "";
  let isStudentDropdownOpen = false;
  let isEmployeeDropdownOpen = false;
  let employeeSearchTerm = "";
  let isLoading = false;

  $: {
    if (activeTab === "payments") {
      sortField = "payment_date";
    } else {
      sortField = "created_at";
    }
  }

  $: filteredEmployees = data.employees.filter((employee) =>
    `${employee.first_name} ${employee.last_name}`
      .toLowerCase()
      .includes(employeeSearchTerm.toLowerCase())
  );

  $: filteredStudents = data.students.filter((student) =>
    `${student.first_name} ${student.last_name} ${student.course?.course_code}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  $: totalAmount = calculateTotalAmount(selectedStudent, selectedUniformType);

  $: sortedOrders = [...(filteredResults || data.orders || [])].sort((a, b) => {
    let comparison = 0;
    if (sortField === "id") {
      comparison = a.id - b.id;
    } else if (sortField === "student") {
      comparison =
        `${a.student?.first_name} ${a.student?.last_name}`.localeCompare(
          `${b.student?.first_name} ${b.student?.last_name}`
        );
    } else if (sortField === "created_at" || sortField === "due_date") {
      comparison = new Date(a[sortField]) - new Date(b[sortField]);
    } else {
      comparison = (a[sortField] || "")
        .toString()
        .localeCompare((b[sortField] || "").toString());
    }
    return sortDirection === "asc" ? comparison : -comparison;
  });

  $: filteredOrders = sortedOrders.filter((order) => {
    // First apply search filter
    const studentName =
      `${order.student?.first_name} ${order.student?.last_name}`.toLowerCase();
    const employeeName =
      `${order.employee?.first_name} ${order.employee?.last_name}`.toLowerCase();
    const totalAmount = order.total_amount.toString();
    const matchesSearch =
      studentName.includes(searchTerm.toLowerCase()) ||
      employeeName.includes(searchTerm.toLowerCase()) ||
      totalAmount.includes(searchTerm);

    // Then apply date filter if dates are set
    if (dateRange.start && dateRange.end) {
      const orderDate = new Date(order.due_date);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      return matchesSearch && orderDate >= startDate && orderDate <= endDate;
    }

    return matchesSearch;
  });

  $: pendingOrders = filteredOrders.filter(
    (order) => order.status === "pending"
  );
  $: inProgressOrders = filteredOrders.filter(
    (order) => order.status === "in progress"
  );
  $: completedOrders = filteredOrders.filter(
    (order) => order.status === "completed"
  );

  // Add this computed property
  $: availableUniformTypes = selectedStudent
    ? getAvailableUniformTypes(selectedStudent, data.uniformConfigs)
    : [];

  // Add this computed property for price breakdown
  $: priceBreakdown = getPriceBreakdown(
    selectedStudent,
    selectedUniformType,
    data.uniformConfigs
  );

  // Add this computed property
  $: displayPaymentStatus = (order) => {
    if (order.amount_paid === 0) return "Not Paid";
    if (order.amount_paid >= order.total_amount) return "Fully Paid";
    return "Partial";
  };

  $: formatPaymentDate = (date) => {
    return date ? format(new Date(date), "MMM d, yyyy") : "No payment";
  };

  $: if (selectedStudent && availableUniformTypes.length === 1) {
    selectedUniformType = availableUniformTypes[0];
  }

  function calculateTotalAmount(student, uniformType) {
    if (!student || !uniformType) return 0;

    const configs = data.uniformConfigs.filter(
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

  // Add this function to get price breakdown
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

  function toggleSort(field) {
    if (sortField === field) {
      sortDirection = sortDirection === "asc" ? "desc" : "asc";
    } else {
      sortField = field;
      sortDirection = "asc";
    }
  }

  function selectStudent(student) {
    selectedStudent = student;
    showModal = false;
  }

  function resetForm() {
    selectedStudent = null;
    selectedUniformType = "upper";
    selectedDueDate = "";
    showCreateModal = false;
    showModal = false; // Also close the student search modal
    isEditing = false;
    orderToEdit = null;
    searchTerm = ""; // Add this to clear the search term
    isStudentDropdownOpen = false; // Add this to ensure dropdown is closed
  }

  // Modify the toggleOrderSelection to handle individual selections
  function toggleOrderSelection(orderId) {
    selectedOrders = selectedOrders.includes(orderId)
      ? selectedOrders.filter((id) => id !== orderId)
      : [...selectedOrders, orderId];
    // Update selectAll state
    selectAll = selectedOrders.length === pendingOrders.length;
  }

  // Add new function to handle select all
  function toggleSelectAll() {
    selectAll = !selectAll;
    selectedOrders = selectAll ? pendingOrders.map((order) => order.id) : [];
  }

  // Add function to handle successful assignment
  function handleAssignmentSuccess() {
    selectedOrders = [];
    selectAll = false;
    selectedEmployee = null;
  }

  // Add this function for tab switching
  function switchTab(tab) {
    activeTab = tab;
    selectedOrders = []; // Clear selections when switching tabs
    if (browser) {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      history.pushState({}, "", url.toString());
    }
  }

  // Add function to handle filter reset
  function resetFilter() {
    dateRange.start = "";
    dateRange.end = "";
    filteredResults = null;
  }

  // Update the enhance function in the create order form
  const handleCreateOrder = () => {
    return async ({ result }) => {
      if (result.type === "success") {
        resetForm();
        reloadWithTab("pending");
      }
    };
  };

  // Update the enhance function in the assign orders form
  const handleAssignOrders = () => {
    return async ({ result }) => {
      if (result.type === "success") {
        handleAssignmentSuccess();
        reloadWithTab("in_progress");
      }
    };
  };

  // Update the enhance function in the filter orders form
  const handleFilterOrders = () => {
    return async ({ result }) => {
      if (result.type === "success" && result.data.filteredOrders) {
        filteredResults = result.data.filteredOrders;
        await invalidate("app:orders"); // Reload the data
      }
    };
  };

  // Add this function for consistent sort icons
  function getSortIcon(field) {
    if (sortField !== field) return "↕";
    return sortDirection === "asc" ? "↑" : "↓";
  }

  // Add this function
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

  $: selectedUniformConfig =
    selectedStudent && selectedUniformType
      ? data.uniformConfigs.find(
          (c) =>
            c.course_id === selectedStudent.course_id &&
            c.gender === selectedStudent.gender &&
            c.wear_type === selectedUniformType
        )
      : null;

  // Modify this function
  const handleDeleteOrder = () => {
    isLoading = true;
    return async ({ result }) => {
      if (result.type === "success") {
        isLoading = false;
        orderToDelete = null; // Close modal
        reloadWithTab("pending");
      }
    };
  };

  //  handle edit button click
  function handleEditClick(order) {
    isEditing = true;
    orderToEdit = order;
    selectedStudent = data.students.find((s) => s.id === order.student.id);
    selectedUniformType = order.uniform_type;
    selectedDueDate = order.due_date;
    searchTerm = `${order.student.first_name} ${order.student.last_name} (${order.student.course?.course_code})`; // Add this to show student name
    showCreateModal = true;
  }

  // edit form submission
  const handleEditOrder = () => {
    isLoading = true;
    return async ({ result }) => {
      if (result.type === "success") {
        resetForm();
        reloadWithTab("pending");
        isLoading = false;
      }
    };
  };

  const handlePayment = () => {
    return async ({ result }) => {
      isLoading = true;
      if (result.type === "success") {
        orderToPayment = null;
        paymentAmount = "";
        reloadWithTab("payments");
        isLoading = false;
      }
    };
  };

  function reloadWithTab(tab) {
    if (browser) {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      window.location.href = url.toString();
    }
  }

  $: {
    if (browser) {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam) {
        activeTab = tabParam;
      }
    }
  }

  function sort(field) {
    if (sortField === field) {
      sortDirection = sortDirection === "asc" ? "desc" : "asc";
    } else {
      sortField = field;
      sortDirection = "asc";
    }

    sortedOrders = [...(filteredResults || data.orders || [])].sort((a, b) => {
      let comparison = 0;

      switch (field) {
        case "id":
          comparison = a.id - b.id;
          break;
        case "student":
          const aName = `${a.student?.first_name} ${a.student?.last_name}`;
          const bName = `${b.student?.first_name} ${b.student?.last_name}`;
          comparison = aName.localeCompare(bName);
          break;
        case "total_amount":
          comparison = a.total_amount - b.total_amount;
          break;
        case "amount_paid":
          comparison = a.amount_paid - b.amount_paid;
          break;
        case "balance":
          comparison =
            a.total_amount - a.amount_paid - (b.total_amount - b.amount_paid);
          break;
        case "payment_date":
          const aDate = a.payment_date ? new Date(a.payment_date) : new Date(0);
          const bDate = b.payment_date ? new Date(b.payment_date) : new Date(0);
          comparison = aDate - bDate;
          break;
        default:
          comparison = String(a[field] || "").localeCompare(
            String(b[field] || "")
          );
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }

  // Add these new handlers
  const handleFilter = () => {
    isLoading = true;
    return async ({ result }) => {
      if (result.type === "success" && result.data.filteredOrders) {
        filteredResults = result.data.filteredOrders;
        await invalidate("app:orders");
      }
      isLoading = false;
    };
  };

  const handleCreateClick = () => {
    if (!isLoading) {
      showCreateModal = true;
    }
  };

  const handleRecordPayment = (order) => {
    if (!isLoading) {
      orderToPayment = order;
    }
  };
</script>

<!-- Student Search Modal -->
{#if showModal}
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[51]"
  >
    <div class="bg-white p-6 rounded-lg w-[500px] max-h-[80vh] flex flex-col">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold">Search Student</h2>
        <button
          class="text-gray-500 hover:text-gray-700"
          on:click={() => (showModal = false)}
        >
          &times;
        </button>
      </div>

      <!-- Search input -->
      <div class="mb-4">
        <div class="relative">
          <input
            type="text"
            bind:value={searchTerm}
            placeholder="Search by name or course..."
            class="w-full p-2 pr-8 border rounded"
          />
        </div>
      </div>

      <!-- Results list -->
      <div class="flex-1 overflow-y-auto">
        {#if filteredStudents.length === 0}
          <p class="text-center text-gray-500 py-4">No students found</p>
        {:else}
          <div class="divide-y">
            {#each filteredStudents as student}
              <div
                class="p-3 hover:bg-gray-50 cursor-pointer flex items-center space-x-4"
                on:click={() => selectStudent(student)}
              >
                <div class="flex-1">
                  <div class="font-semibold">
                    {student.first_name}
                    {student.last_name}
                  </div>
                  <div class="text-sm text-gray-600">
                    <span class="inline-block bg-gray-100 px-2 py-0.5 rounded">
                      {student.course?.course_code}
                    </span>
                    <span class="ml-2 capitalize">{student.gender}</span>
                  </div>
                </div>
                <div class="text-gray-400">→</div>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <div class="mt-4 pt-4 border-t text-sm text-gray-500">
        {filteredStudents.length} student{filteredStudents.length > 1
          ? "s"
          : ""} found
      </div>
    </div>
  </div>
{/if}

<!-- Replace the Create/Edit Order Modal section -->
{#if showCreateModal}
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
  >
    <div
      class="bg-white p-6 rounded-lg w-[80%] max-w-5xl max-h-[95vh] overflow-auto"
    >
      <div class="flex justify-between mb-6">
        <h2 class="text-2xl font-bold">
          {isEditing ? "Edit Order" : "Create New Order"}
        </h2>
        <button on:click={resetForm} class="text-gray-500 text-xl"
          >&times;</button
        >
      </div>

      <form
        method="POST"
        action={isEditing ? "?/editOrder" : "?/createOrder"}
        use:enhance={isEditing ? handleEditOrder : handleCreateOrder}
        class="space-y-4"
      >
        {#if isEditing}
          <input type="hidden" name="orderId" value={orderToEdit.id} />
        {/if}

        <!-- Rest of the form remains the same -->
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
                        {#if data.students.length > 0}
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
                                  {student.first_name}
                                  {student.last_name}
                                </div>
                                <div class="text-sm text-gray-600">
                                  <span
                                    class="inline-block bg-gray-100 px-2 py-0.5 rounded"
                                  >
                                    {student.course?.course_code}
                                  </span>
                                  <span class="ml-2 capitalize"
                                    >{student.gender}</span
                                  >
                                </div>
                              </div>
                              <div class="text-gray-400">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  class="h-5 w-5"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fill-rule="evenodd"
                                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a 1 1 0 011.414-1.414l4 4a 1 1 0 010 1.414l-4 4a 1 1 0 01-1.414 0z"
                                    clip-rule="evenodd"
                                  />
                                </svg>
                              </div>
                            </div>
                          {/each}
                        {:else}
                          <p class="text-gray-500 text-center p-3">
                            No students found
                          </p>
                        {/if}
                      </div>
                    {/if}
                  </div>
                  <input
                    type="hidden"
                    name="studentId"
                    value={selectedStudent?.id}
                    required
                  />
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
                        {type === "upper"
                          ? "Upper Wear"
                          : type === "lower"
                            ? "Lower Wear"
                            : "Both"}
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
                    min={new Date().toISOString().split("T")[0]}
                    class="w-full p-2 border rounded"
                    required
                  />
                </div>
              </div>
            </div>

            {#if selectedStudent}
              <div class="bg-gray-50 p-6 rounded-lg">
                <h3 class="text-lg font-semibold mb-4 text-primary">
                  Student Details
                </h3>
                <div class="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span class="text-gray-600">Course:</span>
                    <p class="font-medium">
                      {selectedStudent.course?.course_code}
                    </p>
                  </div>
                  <div>
                    <span class="text-gray-600">Gender:</span>
                    <p class="font-medium capitalize">
                      {selectedStudent.gender}
                    </p>
                  </div>
                </div>
              </div>
            {/if}
          </div>

          <!-- Right Column - Price Breakdown -->
          <div class="bg-gray-50 p-6 rounded-lg">
            <h3 class="text-lg font-semibold mb-4 text-primary">
              Price Breakdown
            </h3>

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
                  <div
                    class="flex justify-between items-center text-lg font-bold"
                  >
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
            <input
              type="hidden"
              name="uniformConfigId"
              value={selectedUniformConfig?.id}
            />
          </div>
        </div>

        <!-- Footer with buttons -->
        <div class="border-t pt-6 mt-6 flex justify-end gap-3">
          <button
            type="button"
            class="px-6 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
            on:click={resetForm}
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
            disabled={!selectedStudent ||
              !selectedUniformType ||
              !selectedDueDate ||
              isLoading}
          >
            {#if isLoading}
              <div
                class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"
              ></div>
            {/if}
            {isEditing ? "Save Changes" : "Create Order"}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Add Delete Confirmation Modal -->
{#if orderToDelete}
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
  >
    <div class="bg-white p-6 rounded-lg w-[400px]">
      <h2 class="text-xl font-bold mb-4">Delete Order</h2>
      <p class="mb-6 text-gray-600">
        Are you sure you want to delete this order? This action cannot be
        undone.
      </p>

      <form
        method="POST"
        action="?/deleteOrder"
        use:enhance={handleDeleteOrder}
        class="flex justify-end gap-3"
      >
        <input type="hidden" name="orderId" value={orderToDelete.id} />
        <button
          type="button"
          class="px-4 py-2 border rounded hover:bg-gray-50"
          on:click={() => (orderToDelete = null)}
        >
          Cancel
        </button>
        <button
          type="submit"
          class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2 {isLoading
            ? 'opacity-50 cursor-not-allowed'
            : ''}"
          disabled={isLoading}
        >
          {#if isLoading}
            <div
              class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"
            ></div>
          {/if}
          Delete
        </button>
      </form>
    </div>
  </div>
{/if}

<!-- Payment Modal -->
{#if orderToPayment}
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
  >
    <div class="bg-white rounded-2xl w-[500px] max-h-[90vh] overflow-auto">
      <!-- Header Section -->
      <div class="bg-primary text-white px-8 py-6">
        <div class="flex justify-between items-center">
          <h2 class="text-2xl font-bold">Record Payment</h2>
          <button
            class="text-white hover:text-gray-200 transition-colors"
            on:click={() => (orderToPayment = null)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <p class="text-primary-50 mt-2">Order #{orderToPayment.id}</p>
      </div>

      <!-- Order Details Section -->
      <div class="px-8 py-6 bg-gray-50">
        <div class="space-y-4">
          <div class="flex items-center space-x-4">
            <div
              class="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-lg">
                {orderToPayment.student?.first_name}
                {orderToPayment.student?.last_name}
              </h3>
              <p class="text-gray-600 text-sm">Student</p>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-4 mt-4">
            <div class="bg-white p-4 rounded-lg shadow-sm">
              <p class="text-sm text-gray-600">Total Amount</p>
              <p class="text-lg font-bold text-primary">
                ₱{orderToPayment.total_amount}
              </p>
            </div>
            <div class="bg-white p-4 rounded-lg shadow-sm">
              <p class="text-sm text-gray-600">Amount Paid</p>
              <p class="text-lg font-bold text-green-600">
                ₱{orderToPayment.amount_paid}
              </p>
            </div>
            <div class="bg-white p-4 rounded-lg shadow-sm">
              <p class="text-sm text-gray-600">Balance</p>
              <p class="text-lg font-bold text-red-600">
                ₱{orderToPayment.balance}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Payment Form Section -->
      <form
        method="POST"
        action="?/updatePayment"
        use:enhance={handlePayment}
        class="px-8 py-6 space-y-6"
      >
        <input type="hidden" name="orderId" value={orderToPayment.id} />

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Payment Amount
          </label>
          <div class="relative">
            <span
              class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
              >₱</span
            >
            <input
              type="number"
              name="amountPaid"
              bind:value={paymentAmount}
              step="1"
              min={orderToPayment.amount_paid === 0
                ? 0
                : -orderToPayment.amount_paid}
              class="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
              placeholder="Enter amount"
              required
            />
          </div>

          <!-- Add payment summary section -->
          <div class="mt-4 p-4 bg-gray-50 rounded-lg space-y-2">
            <div class="flex justify-between">
              <span>Current Amount Paid:</span>
              <span>₱{orderToPayment.amount_paid}</span>
            </div>
            <div class="flex justify-between">
              <span>New Payment:</span>
              <span>₱{paymentAmount || 0}</span>
            </div>
            <div class="flex justify-between">
              <span>Total Amount:</span>
              <span>₱{orderToPayment.total_amount}</span>
            </div>

            <!-- Show projected balance or change -->
            {#if paymentAmount}
              {@const newTotal =
                orderToPayment.amount_paid + parseFloat(paymentAmount)}
              {#if newTotal > orderToPayment.total_amount}
                <div
                  class="flex justify-between text-primary font-semibold border-t pt-2"
                >
                  <span>Change:</span>
                  <span
                    >₱{(newTotal - orderToPayment.total_amount).toFixed(
                      2
                    )}</span
                  >
                </div>
                <p class="text-sm text-primary">
                  Note: Only ₱{(
                    orderToPayment.total_amount - orderToPayment.amount_paid
                  ).toFixed(2)} will be recorded
                </p>
              {:else}
                <div class="flex justify-between font-semibold border-t pt-2">
                  <span>Remaining Balance:</span>
                  <span
                    >₱{(orderToPayment.total_amount - newTotal).toFixed(
                      2
                    )}</span
                  >
                </div>
              {/if}
            {/if}
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            class="px-6 py-2 border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            on:click={() => (orderToPayment = null)}
          >
            Cancel
          </button>
          <button
            type="submit"
            class="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2 {isLoading
              ? 'opacity-50 cursor-not-allowed'
              : ''}"
            disabled={isLoading}
          >
            {#if isLoading}
              <div
                class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"
              ></div>
            {/if}
            Record Payment
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Main content -->
<div class="p-6">
  <div
    class="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0 mb-6"
  >
    <h1 class="text-2xl font-bold text-foreground">Order Management</h1>
    <button
      class="w-full md:w-auto bg-primary text-white px-4 py-2 rounded-lg"
      on:click={handleCreateClick}
      disabled={isLoading}
    >
      Create New Order
    </button>
  </div>

  <div class="bg-white p-6 rounded-lg shadow-md">
    <!-- Update search and filter controls -->
    <div class="flex flex-col md:flex-row justify-between gap-4 md:gap-0 mb-4">
      <h2 class="text-xl font-semibold">Orders List</h2>
      <input
        type="text"
        bind:value={searchTerm}
        placeholder="Search orders..."
        class="w-full md:w-auto border rounded p-2"
      />
    </div>

    <!-- Update tab navigation -->
    <div class="flex flex-wrap gap-2 md:gap-4 mb-6 border-b overflow-x-auto">
      <button
        class="px-4 py-2 {activeTab === 'pending'
          ? 'border-b-2 border-primary font-semibold'
          : ''}"
        on:click={() => switchTab("pending")}
      >
        Pending Orders ({pendingOrders.length})
      </button>
      <button
        class="px-4 py-2 {activeTab === 'in_progress'
          ? 'border-b-2 border-primary font-semibold'
          : ''}"
        on:click={() => switchTab("in_progress")}
      >
        In Progress ({inProgressOrders.length})
      </button>
      <button
        class="px-4 py-2 {activeTab === 'completed'
          ? 'border-b-2 border-primary font-semibold'
          : ''}"
        on:click={() => switchTab("completed")}
      >
        Completed ({completedOrders.length})
      </button>
      <button
        class="px-4 py-2 {activeTab === 'payments'
          ? 'border-b-2 border-primary font-semibold'
          : ''}"
        on:click={() => switchTab("payments")}
      >
        Payments ({data.orders.length})
      </button>
    </div>

    {#if activeTab === "pending"}
      <!-- Update assignment controls -->
      <div
        class="flex flex-row max-md:flex-col items-start md:items-center justify-between gap-4 mb-4 bg-muted p-4 rounded-lg"
      >
        <div class="flex items-center gap-4">
          <label class="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectAll}
              on:change={toggleSelectAll}
              class="w-4 h-4"
            />
            <span>Select All Orders</span>
          </label>
          {#if selectedOrders.length > 0}
            <span class="text-sm text-gray-600">
              {selectedOrders.length} order{selectedOrders.length > 1
                ? "s"
                : ""}
            </span>
          {/if}
        </div>

        {#if selectedOrders.length > 0}
          <form
            method="POST"
            action="?/assignOrders"
            use:enhance={handleAssignOrders}
            class="flex gap-4 items-center max-md:flex-col"
          >
            <div class="relative min-w-[250px]">
              <input
                type="text"
                bind:value={employeeSearchTerm}
                placeholder="Search tailor..."
                class="w-full p-2 border rounded {selectedEmployee
                  ? 'bg-gray-50'
                  : ''}"
                readonly={selectedEmployee}
                on:focus={() => {
                  if (selectedEmployee) {
                    selectedEmployee = null;
                    employeeSearchTerm = "";
                  }
                  isEmployeeDropdownOpen = true;
                }}
              />
              {#if isEmployeeDropdownOpen && !selectedEmployee}
                <div
                  class="absolute z-50 mt-1 w-full bg-white rounded-lg shadow-lg max-h-60 overflow-y-auto"
                >
                  {#if filteredEmployees.length > 0}
                    {#each filteredEmployees as employee}
                      <div
                        class="p-3 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                        on:click={() => {
                          selectedEmployee = employee;
                          employeeSearchTerm = `${employee.first_name} ${employee.last_name}`;
                          isEmployeeDropdownOpen = false;
                        }}
                      >
                        <div class="font-semibold">
                          {employee.first_name}
                          {employee.last_name}
                        </div>
                        <div class="text-gray-400">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fill-rule="evenodd"
                              d="M7.293 14.707a 1 1 0 010-1.414L10.586 10 7.293 6.707a 1 1 0 011.414-1.414l4 4a 1 1 0 010 1.414l-4 4a 1 1 0 01-1.414 0z"
                              clip-rule="evenodd"
                            />
                          </svg>
                        </div>
                      </div>
                    {/each}
                  {:else}
                    <p class="text-gray-500 text-center p-3">
                      No employees found
                    </p>
                  {/if}
                </div>
              {/if}
            </div>
            <input
              type="hidden"
              name="employeeId"
              value={selectedEmployee?.id}
              required
            />
            <input
              type="hidden"
              name="orderIds"
              value={selectedOrders.join(",")}
            />
            <button
              type="submit"
              class="bg-accent text-white px-4 py-2 rounded hover:bg-accent-hover transition-colors flex items-center gap-2 {isLoading
                ? 'opacity-50 cursor-not-allowed'
                : ''}"
              disabled={!selectedEmployee || isLoading}
            >
              {#if isLoading}
                <div
                  class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                ></div>
              {/if}
              Assign Orders
            </button>
          </form>
        {/if}
      </div>
    {/if}

    {#if activeTab !== "payments"}
      <div
        class="flex flex-col md:flex-row items-center gap-4 mb-4 bg-muted p-4 rounded-lg"
      >
        <span class="font-medium text-gray-700">Filter by Due Date:</span>
        <div class="flex flex-wrap gap-4 items-center">
          <div class="flex items-center gap-2 max-md:flex-col">
            <input
              type="date"
              bind:value={dateRange.start}
              class="border rounded p-2"
              placeholder="Start date"
            />
            <span class="text-gray-500">to</span>
            <input
              type="date"
              bind:value={dateRange.end}
              class="border rounded p-2"
              placeholder="End date"
            />
          </div>

          {#if dateRange.start || dateRange.end}
            <button
              class="px-4 py-2 text-gray-600 border rounded hover:bg-gray-50 flex items-center gap-2"
              on:click={() => {
                dateRange.start = "";
                dateRange.end = "";
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Clear Filter
            </button>
          {/if}
        </div>
      </div>
    {/if}

    <!-- Update table section -->
    <div class="overflow-x-auto -mx-6 md:mx-0">
      <div class="min-w-[800px] md:w-full p-6 md:p-0">
        <table class="w-full">
          {#if activeTab === "payments"}
            <thead>
              <tr class="bg-muted max-md:whitespace-nowrap">
                {#each ["id", "student", "status", "total_amount", "amount_paid", "balance", "payment_date", "payment_status"] as field}
                  <th
                    class="p-2 cursor-pointer hover:bg-gray-200 text-left"
                    on:click={() => sort(field.toLowerCase())}
                  >
                    {field === "total_amount"
                      ? "Total"
                      : field === "amount_paid"
                        ? "Paid"
                        : field === "payment_date"
                          ? "Payment Date"
                          : field === "payment_status"
                            ? "Payment Status"
                            : field.charAt(0).toUpperCase() +
                              field.slice(1).replace("_", " ")}
                    {#if sortField === field}
                      <span class="ml-1"
                        >{sortDirection === "asc" ? "↑" : "↓"}</span
                      >
                    {/if}
                  </th>
                {/each}
                <th class="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each sortedOrders.filter((order) => {
                const studentName = `${order.student?.first_name} ${order.student?.last_name}`.toLowerCase();
                const searchTermLower = searchTerm.toLowerCase();
                return studentName.includes(searchTermLower);
              }) as order}
                <tr class="border-b hover:bg-muted">
                  <td class="p-2">{order.id}</td>
                  <td class="p-2"
                    >{order.student?.first_name} {order.student?.last_name}</td
                  >
                  <td class="p-2">
                    <span
                      class={`px-2 py-1 rounded-full text-sm
                                                    ${
                                                      order.status ===
                                                      "completed"
                                                        ? "bg-green-100 text-green-800"
                                                        : order.status ===
                                                            "in progress"
                                                          ? "bg-blue-100 text-blue-800"
                                                          : "bg-yellow-100 text-yellow-800"
                                                    }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td class="p-2">₱{order.total_amount}</td>
                  <td class="p-2">₱{order.amount_paid}</td>
                  <td class="p-2">₱{order.balance}</td>
                  <td class="p-2">{formatPaymentDate(order.payment_date)}</td>
                  <td class="p-2">
                    <span
                      class={`px-2 py-1 rounded-full text-sm
                                                    ${
                                                      order.payment_status ===
                                                      "fully paid"
                                                        ? "bg-green-100 text-green-800"
                                                        : order.payment_status ===
                                                            "partial"
                                                          ? "bg-yellow-100 text-yellow-800"
                                                          : "bg-red-100 text-red-800"
                                                    }`}
                    >
                      {displayPaymentStatus(order)}
                    </span>
                  </td>
                  <td class="p-2">
                    <button
                      class="text-blue-600 hover:text-blue-800 {isLoading
                        ? 'opacity-50 cursor-not-allowed'
                        : ''}"
                      on:click={() => handleRecordPayment(order)}
                      disabled={isLoading}
                    >
                      Record Payment
                    </button>
                  </td>
                </tr>
              {/each}
            </tbody>
          {:else}
            <thead>
              <tr class="bg-muted max-md:whitespace-nowrap">
                {#if activeTab === "pending"}
                  <th class="p-2 w-12">Select</th>
                {/if}
                {#each ["id", "student", "uniform_type", "created_at", "due_date", "total_amount", "status"] as field}
                  <th
                    class="p-2 cursor-pointer hover:bg-gray-200 text-left"
                    on:click={() => sort(field)}
                  >
                    {field === "created_at"
                      ? "Ordered At"
                      : field.charAt(0).toUpperCase() +
                        field.slice(1).replace("_", " ")}
                    {#if sortField === field}
                      <span class="ml-1"
                        >{sortDirection === "asc" ? "↑" : "↓"}</span
                      >
                    {/if}
                  </th>
                {/each}
                {#if activeTab !== "pending" && activeTab !== "payments"}
                  <th class="p-2">Assigned To</th>
                {/if}
                {#if activeTab === "payments"}
                  <th class="p-2">Assigned To</th>
                  <th class="p-2">Payment Status</th>
                  <th class="p-2">Balance</th>
                {/if}
                <th class="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {#if activeTab === "pending"}
                {#each pendingOrders.filter((order) => {
                  const studentName = `${order.student?.first_name} ${order.student?.last_name}`.toLowerCase();
                  const employeeName = `${order.employee?.first_name} ${order.employee?.last_name}`.toLowerCase();
                  const totalAmount = order.total_amount.toString();
                  return studentName.includes(searchTerm.toLowerCase()) || employeeName.includes(searchTerm.toLowerCase()) || totalAmount.includes(searchTerm);
                }) as order}
                  <tr class="border-b hover:bg-muted">
                    <td class="p-2">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order.id)}
                        on:change={() => toggleOrderSelection(order.id)}
                        class="w-4 h-4"
                      />
                    </td>
                    <td class="p-2">{order.id}</td>
                    <td class="p-2">
                      {order.student?.first_name}
                      {order.student?.last_name}
                    </td>
                    <td class="p-2">{order.uniform_type}</td>
                    <td class="p-2"
                      >{format(
                        new Date(order.created_at),
                        "MMM d, yyyy h:mm a"
                      )}</td
                    >
                    <td class="p-2"
                      >{format(new Date(order.due_date), "MMM d, yyyy")}</td
                    >
                    <td class="p-2">₱{order.total_amount}</td>
                    <td class="p-2">
                      <span
                        class={`px-2 py-1 rounded-full text-sm
                                                        ${
                                                          order.status ===
                                                          "completed"
                                                            ? "bg-green-100 text-green-800"
                                                            : order.status ===
                                                                "in progress"
                                                              ? "bg-blue-100 text-blue-800"
                                                              : "bg-yellow-100 text-yellow-800"
                                                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td class="p-2">
                      <div class="flex gap-2">
                        <button
                          class="text-blue-600 hover:text-blue-800"
                          on:click={() => handleEditClick(order)}
                        >
                          Edit
                        </button>
                        <button
                          class="text-red-600 hover:text-red-800"
                          on:click={() => (orderToDelete = order)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                {/each}
              {:else if activeTab === "in_progress"}
                {#each inProgressOrders.filter((order) => {
                  const studentName = `${order.student?.first_name} ${order.student?.last_name}`.toLowerCase();
                  const employeeName = `${order.employee?.first_name} ${order.employee?.last_name}`.toLowerCase();
                  const totalAmount = order.total_amount.toString();
                  return studentName.includes(searchTerm.toLowerCase()) || employeeName.includes(searchTerm.toLowerCase()) || totalAmount.includes(searchTerm);
                }) as order}
                  <tr class="border-b hover:bg-muted">
                    <td class="p-2">{order.id}</td>
                    <td class="p-2">
                      {order.student?.first_name}
                      {order.student?.last_name}
                    </td>
                    <td class="p-2">{order.uniform_type}</td>
                    <td class="p-2"
                      >{format(
                        new Date(order.created_at),
                        "MMM d, yyyy h:mm a"
                      )}</td
                    >
                    <td class="p-2"
                      >{format(new Date(order.due_date), "MMM d, yyyy")}</td
                    >
                    <td class="p-2">₱{order.total_amount}</td>
                    <td class="p-2">
                      <span
                        class={`px-2 py-1 rounded-full text-sm
                                                        ${
                                                          order.status ===
                                                          "completed"
                                                            ? "bg-green-100 text-green-800"
                                                            : order.status ===
                                                                "in progress"
                                                              ? "bg-blue-100 text-blue-800"
                                                              : "bg-yellow-100 text-yellow-800"
                                                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td class="p-2">
                      {#if order.employee}
                        {order.employee.first_name} {order.employee.last_name}
                      {:else}
                        <span class="text-gray-400">Unassigned</span>
                      {/if}
                    </td>
                    <td class="p-2">
                      <div class="flex gap-2"></div>
                    </td>
                  </tr>
                {/each}
              {:else if activeTab === "completed"}
                {#each completedOrders.filter((order) => {
                  const studentName = `${order.student?.first_name} ${order.student?.last_name}`.toLowerCase();
                  const employeeName = `${order.employee?.first_name} ${order.employee?.last_name}`.toLowerCase();
                  const totalAmount = order.total_amount.toString();
                  return studentName.includes(searchTerm.toLowerCase()) || employeeName.includes(searchTerm.toLowerCase()) || totalAmount.includes(searchTerm);
                }) as order}
                  <tr class="border-b hover:bg-muted">
                    <td class="p-2">{order.id}</td>
                    <td class="p-2">
                      {order.student?.first_name}
                      {order.student?.last_name}
                    </td>
                    <td class="p-2">{order.uniform_type}</td>
                    <td class="p-2"
                      >{format(
                        new Date(order.created_at),
                        "MMM d, yyyy h:mm a"
                      )}</td
                    >
                    <td class="p-2"
                      >{format(new Date(order.due_date), "MMM d, yyyy")}</td
                    >
                    <td class="p-2">₱{order.total_amount}</td>
                    <td class="p-2">
                      <span
                        class={`px-2 py-1 rounded-full text-sm
                                                        ${
                                                          order.status ===
                                                          "completed"
                                                            ? "bg-green-100 text-green-800"
                                                            : order.status ===
                                                                "in progress"
                                                              ? "bg-blue-100 text-blue-800"
                                                              : "bg-yellow-100 text-yellow-800"
                                                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td class="p-2">
                      {#if order.employee}
                        {order.employee.first_name} {order.employee.last_name}
                      {:else}
                        <span class="text-gray-400">Unassigned</span>
                      {/if}
                    </td>
                    <td class="p-2">
                      <div class="flex gap-2"></div>
                    </td>
                  </tr>
                {/each}
              {/if}
            </tbody>
          {/if}
        </table>
      </div>
    </div>
  </div>
</div>
