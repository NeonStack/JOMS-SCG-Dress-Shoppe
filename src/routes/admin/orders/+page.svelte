<script>
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabaseClient";
  import { fade } from "svelte/transition";

  // State management
  let currentStep = 1;
  let showDetailsModal = false;
  let selectedOrder = null;
  let showDeleteModal = false;
  let orderToDelete = null;
  let students = [];
  let employees = [];
  let courses = [];
  let orders = [];
  let selectedStudent = null;
  let selectedWearType = "";
  let quantity = 1;
  let selectedEmployee = null;
  let dueDate = "";
  let specialInstructions = "";
  let basePrice = 0;
  let totalAmount = 0;
  let showCreateModal = false;
  let searchQuery = "";
  let filteredStudents = [];
  let uniformConfigs = [];

  // Filters
  let statusFilter = [];
  let dateRangeStart = "";
  let dateRangeEnd = "";
  let courseFilter = "";
  let employeeFilter = "";

  // Load initial data
  onMount(async () => {
    await Promise.all([
      fetchStudents(),
      fetchEmployees(),
      fetchCourses(),
      fetchOrders(),
      fetchUniformConfigs(),
    ]);
  });

  async function fetchStudents() {
    const { data, error } = await supabase.from("students").select(`
          *,
          courses:course_id (name)
        `);
    if (error) console.error("Error fetching students:", error);
    else students = data;
    filteredStudents = students;
  }

  async function fetchEmployees() {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "employee");
    if (error) console.error("Error fetching employees:", error);
    else employees = data;
  }

  async function fetchCourses() {
    const { data, error } = await supabase.from("courses").select("*");
    if (error) console.error("Error fetching courses:", error);
    else courses = data;
  }

  async function fetchOrders() {
    const { data, error } = await supabase.from("orders").select(`
          *,
          students:student_id (*),
          uniform_configs:uniform_config_id (*),
          profiles:assigned_to (*)
        `);
    if (error) console.error("Error fetching orders:", error);
    else orders = data;
  }

  async function fetchUniformConfigs() {
    const { data, error } = await supabase.from("uniform_configs").select("*");
    if (error) console.error("Error fetching uniform configs:", error);
    else uniformConfigs = data;
  }

  // Reactive statements
  $: {
    if (searchQuery) {
      filteredStudents = students.filter(
        (student) =>
          `${student.first_name} ${student.last_name}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          student.courses?.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
    } else {
      filteredStudents = students;
    }
  }

  $: {
    if (selectedStudent && selectedWearType && quantity) {
      const config = uniformConfigs.find(
        (c) =>
          c.course_id === selectedStudent.course_id &&
          c.gender === selectedStudent.gender &&
          (c.wear_type === selectedWearType || selectedWearType === "FULL")
      );

      if (config) {
        if (selectedWearType === "FULL") {
          const upperConfig = uniformConfigs.find(
            (c) =>
              c.course_id === selectedStudent.course_id &&
              c.gender === selectedStudent.gender &&
              c.wear_type === "UPPER"
          );
          const lowerConfig = uniformConfigs.find(
            (c) =>
              c.course_id === selectedStudent.course_id &&
              c.gender === selectedStudent.gender &&
              c.wear_type === "LOWER"
          );
          basePrice =
            (upperConfig?.base_price || 0) + (lowerConfig?.base_price || 0);
        } else {
          basePrice = config.base_price;
        }
        totalAmount = basePrice * quantity;
      }
    }
  }

  // Helper functions
  function nextStep() {
    if (currentStep < 3) currentStep++;
  }

  function prevStep() {
    if (currentStep > 1) currentStep--;
  }

  async function createOrder() {
    if (
      !selectedStudent ||
      !selectedWearType ||
      !selectedEmployee ||
      !dueDate
    ) {
      alert("Please fill in all required fields");
      return;
    }

    const orderData = {
      student_id: selectedStudent.id,
      uniform_config_id: uniformConfigs.find(
        (c) =>
          c.course_id === selectedStudent.course_id &&
          c.gender === selectedStudent.gender &&
          c.wear_type === selectedWearType
      )?.id,
      quantity,
      total_amount: totalAmount,
      assigned_to: selectedEmployee.id,
      due_date: dueDate,
      special_instructions: specialInstructions,
      status: "PENDING",
      payment_status: "NO PAYMENT",
    };

    const { error } = await supabase.from("orders").insert(orderData);

    if (error) {
      console.error("Error creating order:", error);
      alert("Error creating order");
    } else {
      alert("Order created successfully");
      resetForm();
      await fetchOrders();
    }
  }

  function resetForm() {
    currentStep = 1;
    selectedStudent = null;
    selectedWearType = "";
    quantity = 1;
    selectedEmployee = null;
    dueDate = "";
    specialInstructions = "";
    showCreateModal = false;
  }

  async function viewOrderDetails(order) {
    selectedOrder = order;
    // Fetch additional details if needed
    const { data: measurements } = await supabase
      .from("student_measurements")
      .select("*, measurement_types(name)")
      .eq("student_id", order.student_id);

    selectedOrder = { ...order, measurements };
    showDetailsModal = true;
  }

  // Filter functions
  function applyFilters() {
    // Implementation of filter logic here
  }

  //delete order func
  async function deleteOrder(order) {
    const { error } = await supabase.from("orders").delete().eq("id", order.id);

    if (error) {
      alert("Error deleting order: " + error.message);
    } else {
      await fetchOrders(); // Refresh the orders list
      showDeleteModal = false;
      orderToDelete = null;
      alert("Order deleted successfully");
    }
  }

  $: availableWearTypes =
    selectedStudent && selectedStudent.course_id && selectedStudent.gender
      ? uniformConfigs
          .filter(
            (c) =>
              c.course_id === selectedStudent.course_id &&
              c.gender === selectedStudent.gender
          )
          .map((c) => c.wear_type)
      : [];
</script>

<div class="container mx-auto px-4 py-8">
  <div class="flex justify-between items-center mb-8">
    <h1 class="text-2xl font-bold text-foreground">Order Processing</h1>
    <button class="btn-primary" on:click={() => (showCreateModal = true)}>
      Create New Order
    </button>
  </div>

  <!-- Filters -->
  <div class="bg-white p-4 rounded-lg shadow mb-8">
    <h2 class="text-lg font-semibold mb-4">Filters</h2>
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="filter-group">
        <label>Status</label>
        <select bind:value={statusFilter} multiple class="input-field">
          <option value="PENDING">Pending</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>
      <!-- Add other filters here -->
    </div>
  </div>

  <!-- Orders Table -->
  <div class="bg-white rounded-lg shadow overflow-hidden">
    <table class="w-full">
      <thead>
        <tr class="bg-muted">
          <th class="table-header">Order ID</th>
          <th class="table-header">Student</th>
          <th class="table-header">Type</th>
          <th class="table-header">Status</th>
          <th class="table-header">Due Date</th>
          <th class="table-header">Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each orders as order}
          <tr class="border-b border-border">
            <td class="table-cell">{order.id.slice(0, 8)}</td>
            <td class="table-cell">
              {order.students?.first_name}
              {order.students?.last_name}
            </td>
            <td class="table-cell">{order.uniform_configs?.wear_type}</td>
            <td class="table-cell">
              <span class="status-badge status-{order.status.toLowerCase()}">
                {order.status}
              </span>
            </td>
            <td class="table-cell">
              {new Date(order.due_date).toLocaleDateString()}
            </td>
            <td class="table-cell">
              <div class="flex gap-2">
                <button
                  class="btn-secondary"
                  on:click={() => viewOrderDetails(order)}
                >
                  View Details
                </button>
                {#if order.status === "PENDING"}
                  <button
                    class="btn-danger"
                    on:click={() => {
                      orderToDelete = order;
                      showDeleteModal = true;
                    }}
                  >
                    Delete
                  </button>
                {/if}
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <!-- Create Order Modal -->
  {#if showCreateModal}
    <div class="modal-backdrop" transition:fade>
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="text-xl font-bold">Create New Order</h2>
          <button class="btn-icon" on:click={resetForm}>&times;</button>
        </div>

        <div class="modal-body">
          <!-- Step 1: Student Selection -->
          {#if currentStep === 1}
            <div class="step-content">
              <h3 class="step-title">Select Student</h3>
              <input
                type="text"
                placeholder="Search students..."
                bind:value={searchQuery}
                class="input-field"
              />
              <div class="student-list">
                {#each filteredStudents as student}
                  <button
                    class="student-item"
                    class:selected={selectedStudent?.id === student.id}
                    on:click={() => (selectedStudent = student)}
                  >
                    <div class="student-info">
                      <span class="font-semibold">
                        {student.first_name}
                        {student.last_name}
                      </span>
                      <span class="text-sm text-secondary">
                        {student.courses?.name} - Year {student.year_level}
                      </span>
                    </div>
                  </button>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Step 2: Order Details -->
          {#if currentStep === 2}
            <div class="step-content">
              <h3 class="step-title">Order Details</h3>
              <div class="form-group">
                <label>Wear Type</label>
                <select bind:value={selectedWearType} class="input-field">
                  <option value="">Select type</option>
                  {#if availableWearTypes.includes("UPPER")}
                    <option value="UPPER">Upper</option>
                  {/if}
                  {#if availableWearTypes.includes("LOWER")}
                    <option value="LOWER">Lower</option>
                  {/if}
                  {#if availableWearTypes.includes("UPPER") && availableWearTypes.includes("LOWER")}
                    <option value="FULL">Full Uniform</option>
                  {/if}
                </select>
              </div>
              <div class="form-group">
                <label>Quantity</label>
                <input
                  type="number"
                  min="1"
                  bind:value={quantity}
                  class="input-field"
                />
              </div>
              <div class="price-summary">
                <div class="flex justify-between">
                  <span>Base Price:</span>
                  <span>₱{basePrice.toFixed(2)}</span>
                </div>
                <div class="flex justify-between font-bold">
                  <span>Total Amount:</span>
                  <span>₱{totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          {/if}

          <!-- Step 3: Assignment -->
          {#if currentStep === 3}
            <div class="step-content">
              <h3 class="step-title">Assignment Details</h3>
              <div class="form-group">
                <label>Assign to Employee</label>
                <select bind:value={selectedEmployee} class="input-field">
                  <option value="">Select employee</option>
                  {#each employees as employee}
                    <option value={employee}>
                      {employee.first_name}
                      {employee.last_name}
                    </option>
                  {/each}
                </select>
              </div>
              <div class="form-group">
                <label>Due Date</label>
                <input type="date" bind:value={dueDate} class="input-field" />
              </div>
              <div class="form-group">
                <label>Special Instructions</label>
                <textarea
                  bind:value={specialInstructions}
                  class="input-field"
                  rows="3"
                ></textarea>
              </div>
            </div>
          {/if}
        </div>

        <div class="modal-footer">
          {#if currentStep > 1}
            <button class="btn-secondary" on:click={prevStep}>
              Previous
            </button>
          {/if}

          {#if currentStep < 3}
            <button
              class="btn-primary"
              on:click={nextStep}
              disabled={!selectedStudent && currentStep === 1}
            >
              Next
            </button>
          {:else}
            <button
              class="btn-primary"
              on:click={createOrder}
              disabled={!selectedEmployee || !dueDate}
            >
              Create Order
            </button>
          {/if}
        </div>
      </div>
    </div>
  {/if}

  {#if showDetailsModal && selectedOrder}
    <div class="modal-backdrop" transition:fade>
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="text-xl font-bold">Order Details</h2>
          <button
            class="btn-icon"
            on:click={() => {
              showDetailsModal = false;
              selectedOrder = null;
            }}
          >
            &times;
          </button>
        </div>
        <div class="modal-body">
          <div class="space-y-4">
            <!-- Student Information -->
            <div class="detail-section">
              <h3 class="text-lg font-semibold">Student Information</h3>
              <p>
                Name: {selectedOrder.students?.first_name}
                {selectedOrder.students?.last_name}
              </p>
              <p>Course: {selectedOrder.students?.courses?.name}</p>
              <p>Year Level: {selectedOrder.students?.year_level}</p>
            </div>

            <!-- Order Information -->
            <div class="detail-section">
              <h3 class="text-lg font-semibold">Order Information</h3>
              <p>Type: {selectedOrder.uniform_configs?.wear_type}</p>
              <p>Quantity: {selectedOrder.quantity}</p>
              <p>Total Amount: ₱{selectedOrder.total_amount}</p>
              <p>
                Status: <span
                  class="status-badge status-{selectedOrder.status.toLowerCase()}"
                  >{selectedOrder.status}</span
                >
              </p>
              <p>
                Due Date: {new Date(
                  selectedOrder.due_date
                ).toLocaleDateString()}
              </p>
            </div>

            <!-- Measurements -->
            {#if selectedOrder.measurements?.length}
              <div class="detail-section">
                <h3 class="text-lg font-semibold">Measurements</h3>
                <div class="grid grid-cols-2 gap-2">
                  {#each selectedOrder.measurements as measurement}
                    <p>
                      {measurement.measurement_types?.name}: {measurement.value}
                    </p>
                  {/each}
                </div>
              </div>
            {/if}

            <!-- Special Instructions -->
            {#if selectedOrder.special_instructions}
              <div class="detail-section">
                <h3 class="text-lg font-semibold">Special Instructions</h3>
                <p>{selectedOrder.special_instructions}</p>
              </div>
            {/if}
          </div>
        </div>
      </div>
    </div>
  {/if}
  {#if showDeleteModal && orderToDelete}
    <div class="modal-backdrop" transition:fade>
      <div class="modal-content max-w-md">
        <div class="modal-header">
          <h2 class="text-xl font-bold">Confirm Deletion</h2>
          <button
            class="btn-icon"
            on:click={() => {
              showDeleteModal = false;
              orderToDelete = null;
            }}
          >
            &times;
          </button>
        </div>
        <div class="modal-body">
          <p class="mb-4">Are you sure you want to delete this order?</p>
          <p class="text-sm text-secondary mb-4">
            This action cannot be undone.
          </p>
          <div class="student-info bg-muted p-3 rounded-lg mb-4">
            <p>
              <strong>Student:</strong>
              {orderToDelete.students?.first_name}
              {orderToDelete.students?.last_name}
            </p>
            <p>
              <strong>Type:</strong>
              {orderToDelete.uniform_configs?.wear_type}
            </p>
            <p><strong>Amount:</strong> ₱{orderToDelete.total_amount}</p>
          </div>
        </div>
        <div class="modal-footer">
          <button
            class="btn-secondary"
            on:click={() => {
              showDeleteModal = false;
              orderToDelete = null;
            }}
          >
            Cancel
          </button>
          <button
            class="btn-danger"
            on:click={() => deleteOrder(orderToDelete)}
          >
            Delete Order
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .btn-primary {
    @apply bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors;
  }

  .btn-secondary {
    @apply bg-secondary text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity;
  }

  .btn-icon {
    @apply text-2xl text-secondary hover:text-primary transition-colors;
  }

  .input-field {
    @apply w-full border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary bg-input;
  }

  .modal-backdrop {
    @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
  }

  .modal-content {
    @apply bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4;
  }

  .modal-header {
    @apply flex justify-between items-center p-4 border-b border-border;
  }

  .modal-body {
    @apply p-4;
  }

  .modal-footer {
    @apply flex justify-end gap-4 p-4 border-t border-border;
  }

  .step-content {
    @apply space-y-4;
  }

  .step-title {
    @apply text-lg font-semibold mb-4;
  }

  .form-group {
    @apply space-y-2;
  }

  .student-list {
    @apply space-y-2 max-h-64 overflow-y-auto;
  }

  .student-item {
    @apply w-full p-3 rounded-lg hover:bg-muted transition-colors text-left;
  }

  .student-item.selected {
    @apply bg-muted border-primary border;
  }

  .table-header {
    @apply px-4 py-3 text-left font-semibold;
  }

  .table-cell {
    @apply px-4 py-3;
  }

  .status-badge {
    @apply px-2 py-1 rounded-full text-sm font-medium;
  }

  .status-pending {
    @apply bg-yellow-100 text-yellow-800;
  }

  .status-in_progress {
    @apply bg-blue-100 text-blue-800;
  }

  .status-completed {
    @apply bg-green-100 text-green-800;
  }

  .filter-group {
    @apply flex flex-col gap-2;
  }

  .price-summary {
    @apply mt-4 p-4 bg-muted rounded-lg space-y-2;
  }

  .detail-section {
    @apply bg-muted p-4 rounded-lg;
  }

  .btn-danger {
    @apply bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors;
  }

  .student-info {
    @apply space-y-1;
  }
</style>
