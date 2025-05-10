<script>
  import { enhance } from "$app/forms";
  import { format } from "date-fns";
  import { invalidate } from "$app/navigation";
  import { browser } from "$app/environment";

  // Import components
  import PendingOrdersTab from "$lib/components/admin/orders/PendingOrdersTab.svelte";
  import InProgressOrdersTab from "$lib/components/admin/orders/InProgressOrdersTab.svelte";
  import CompletedOrdersTab from "$lib/components/admin/orders/CompletedOrdersTab.svelte";
  import PaymentsTab from "$lib/components/admin/orders/PaymentsTab.svelte";
  import StudentSearchModal from "$lib/components/admin/orders/StudentSearchModal.svelte";
  import CreateEditOrderModal from "$lib/components/admin/orders/CreateEditOrderModal.svelte";
  import DeleteOrderModal from "$lib/components/admin/orders/DeleteOrderModal.svelte";
  import PaymentModal from "$lib/components/admin/orders/PaymentModal.svelte";
  import ReceiptModal from "$lib/components/admin/orders/ReceiptModal.svelte";

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
  let orderForReceipt = null;
  let filterUpdateTrigger = 0; // Used to force reactive updates
  let dateFilteredOrders = []; // Add this line to declare the variable

  // Add pagination state
  let rowsPerPage = 10;
  let currentPage = {
    pending: 1,
    in_progress: 1,
    completed: 1,
    payments: 1
  };

  // Function to manually trigger reactive updates
  function triggerFilterUpdate() {
    filterUpdateTrigger += 1;
    console.log("Filter update triggered:", filterUpdateTrigger);
  }

  $: filteredStudents = data.students.filter((student) =>
    `${student.first_name} ${student.last_name} ${student.course?.course_code}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  $: sortedOrders = [...(filteredResults || data.orders || [])].sort((a, b) => {
    let comparison = 0;
    if (sortField === "id") {
      comparison = a.id - b.id;
    } else if (sortField === "student") {
      comparison =
        `${a.student?.first_name} ${a.student?.last_name}`.localeCompare(
          `${b.student?.first_name} ${b.student?.last_name}`
        );
    } else if (sortField === "created_at" || sortField === "due_date" || sortField === "payment_date") {
      comparison = new Date(a[sortField] || 0) - new Date(b[sortField] || 0);
    } else {
      comparison = (a[sortField] || "")
        .toString()
        .localeCompare((b[sortField] || "").toString());
    }
    return sortDirection === "asc" ? comparison : -comparison;
  });

  // Simplified date filter function
  function matchesDateFilter(order) {
    filterUpdateTrigger; // Make this function react to trigger updates
    
    if (!dateRange.start || !dateRange.end) return true;
    
    try {

      if (!order.due_date || typeof order.due_date !== 'string') {
        return false; // Or true if you want to include orders with missing/invalid due_dates
      }

      // Convert strings to Date objects
      const orderDueDate = new Date(order.due_date);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);

      // Check if parsing resulted in an Invalid Date
      if (isNaN(orderDueDate.getTime()) || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        // console.warn("Invalid date encountered in filter:", { 
        //   order_id: order.id, 
        //   order_due_date: order.due_date, 
        //   range_start: dateRange.start, 
        //   range_end: dateRange.end 
        // });
        return false; // Do not include if any date is invalid
      }
      
      // Ensure we're comparing dates properly by normalizing times
      orderDueDate.setHours(0, 0, 0, 0);
      startDate.setHours(0, 0, 0, 0); 
      endDate.setHours(23, 59, 59, 999);
      
      return orderDueDate >= startDate && orderDueDate <= endDate;
    } catch (e) {
      console.error("Date filtering error:", e, { 
        order_id: order.id, 
        order_due_date: order.due_date,
        message: e.message
      });
      return false; // Change to false: if an error occurs, the order does not match the filter.
    }
  }

  // Apply date filter first, then search filter
  $: {
    // Make this statement directly dependent on dateRange values
    dateFilteredOrders = sortedOrders.filter(order => matchesDateFilter(order));
    console.log("Date filtering applied", dateRange);
  }

  // Then apply search filter to the date-filtered orders for regular tabs
  $: searchFilteredOrders = dateFilteredOrders.filter(order => {
    // If no search term, return all date-filtered orders
    if (!searchTerm.trim()) return true;
    
    // Apply search filter to all relevant fields
    const searchTermLower = searchTerm.toLowerCase().trim();
    
    try {
      // Common fields
      const id = order.id.toString();
      
      // Special handling for ID search - must match from the beginning
      const isNumericSearch = /^\d+$/.test(searchTermLower);
      const idMatches = isNumericSearch 
        ? id === searchTermLower || id.startsWith(searchTermLower)
        : false;
      
      const studentName = order.student 
        ? `${order.student.first_name} ${order.student.last_name}`.toLowerCase() 
        : "";
      const uniformType = (order.uniform_type || "").toLowerCase();
      
      // Convert dates safely
      let orderDate = "";
      let dueDate = "";
      
      try {
        if (order.created_at) {
          orderDate = format(new Date(order.created_at), "MMM d, yyyy h:mm a").toLowerCase();
        }
        if (order.due_date) {
          dueDate = format(new Date(order.due_date), "MMM d, yyyy").toLowerCase();
        }
      } catch (e) {
        console.error("Date formatting error:", e);
      }
      
      const totalAmount = (order.total_amount || "").toString();
      const status = (order.status || "").toLowerCase();
      
      // Employee related fields
      const employeeName = order.employee 
        ? `${order.employee.first_name} ${order.employee.last_name}`.toLowerCase() 
        : "";
      const assignedBy = (order.assigned_by || "").toLowerCase();
      
      return idMatches || 
        studentName.includes(searchTermLower) ||
        uniformType.includes(searchTermLower) ||
        orderDate.includes(searchTermLower) ||
        dueDate.includes(searchTermLower) ||
        totalAmount.includes(searchTermLower) ||
        status.includes(searchTermLower) ||
        employeeName.includes(searchTermLower) ||
        assignedBy.includes(searchTermLower);
    } catch (error) {
      console.error("Error filtering order:", error, order);
      return false;
    }
  });

  // Filter for payments tab
  $: filteredPayments = dateFilteredOrders.filter(order => {
    // If no search term, return all date-filtered orders
    if (!searchTerm.trim()) return true;
    
    const searchTermLower = searchTerm.toLowerCase().trim();
    
    try {
      // Payment-specific fields
      const id = order.id.toString();
      
      // Special handling for ID search - must match from the beginning
      const isNumericSearch = /^\d+$/.test(searchTermLower);
      const idMatches = isNumericSearch 
        ? id === searchTermLower || id.startsWith(searchTermLower)
        : false;
      
      const studentName = order.student 
        ? `${order.student.first_name} ${order.student.last_name}`.toLowerCase() 
        : "";
      const status = (order.status || "").toLowerCase();
      const totalAmount = (order.total_amount || "").toString();
      const amountPaid = (order.amount_paid || "").toString();
      const balance = (order.balance || "").toString();
      
      // Format payment date
      let paymentDate = "";
      try {
        if (order.payment_date) {
          paymentDate = format(new Date(order.payment_date), "MMM d, yyyy").toLowerCase();
        }
      } catch (e) {
        console.error("Date formatting error:", e);
      }
      
      const paymentStatus = (order.payment_status || "").toLowerCase();
      const paymentUpdatedBy = (order.payment_updated_by || "").toLowerCase();
      
      return idMatches || 
        studentName.includes(searchTermLower) ||
        status.includes(searchTermLower) ||
        totalAmount.includes(searchTermLower) ||
        amountPaid.includes(searchTermLower) ||
        balance.includes(searchTermLower) ||
        paymentDate.includes(searchTermLower) ||
        paymentStatus.includes(searchTermLower) ||
        paymentUpdatedBy.includes(searchTermLower);
    } catch (error) {
      console.error("Error filtering payment:", error, order);
      return false;
    }
  });

  // Filter search results by status
  $: pendingOrders = searchFilteredOrders.filter(order => order.status === "pending");
  $: inProgressOrders = searchFilteredOrders.filter(order => order.status === "in progress");
  $: completedOrders = searchFilteredOrders.filter(order => order.status === "completed");

  // Calculate total pages for each tab
  $: totalPages = {
    pending: Math.ceil(pendingOrders.length / rowsPerPage),
    in_progress: Math.ceil(inProgressOrders.length / rowsPerPage),
    completed: Math.ceil(completedOrders.length / rowsPerPage),
    payments: Math.ceil(filteredPayments.length / rowsPerPage)
  };

  // Get paginated orders for each tab
  $: paginatedOrders = {
    pending: pendingOrders.slice(
      (currentPage.pending - 1) * rowsPerPage,
      currentPage.pending * rowsPerPage
    ),
    in_progress: inProgressOrders.slice(
      (currentPage.in_progress - 1) * rowsPerPage,
      currentPage.in_progress * rowsPerPage
    ),
    completed: completedOrders.slice(
      (currentPage.completed - 1) * rowsPerPage,
      currentPage.completed * rowsPerPage
    ),
    payments: filteredPayments.slice(
      (currentPage.payments - 1) * rowsPerPage,
      currentPage.payments * rowsPerPage
    )
  };

  // Navigation functions
  function handlePageChange(event) {
    const { action, page } = event.detail;
    if (action === 'prev') {
      prevPage(activeTab);
    } else if (action === 'next') {
      nextPage(activeTab);
    } else if (action === 'goto' && page) {
      goToPage(activeTab, page);
    }
  }

  function nextPage(tab) {
    if (currentPage[tab] < totalPages[tab]) currentPage[tab]++;
  }

  function prevPage(tab) {
    if (currentPage[tab] > 1) currentPage[tab]--;
  }

  function goToPage(tab, page) {
    currentPage[tab] = page;
  }

  // Reset to first page when filters change
  $: if (searchTerm || dateRange.start || dateRange.end) {
    currentPage = {
      pending: 1,
      in_progress: 1,
      completed: 1,
      payments: 1
    };
  }

  // Set default sort field based on tab
  $: {
    if (activeTab === "payments" && sortField !== "payment_date") {
      sortField = "payment_date";
    } else if (activeTab !== "payments" && sortField === "payment_date") {
      sortField = "created_at";
    }
  }

  // Filter reset function
  function resetAllFilters() {
    searchTerm = "";
    
    // Clear date range
    dateRange = { start: "", end: "" };
    
    // Reset pagination
    currentPage = {
      pending: 1,
      in_progress: 1,
      completed: 1,
      payments: 1
    };
    
    // Force filter update
    triggerFilterUpdate();
    
    console.log("All filters have been reset");
  }

  // Tab switching
  function switchTab(tab) {
    activeTab = tab;
    selectedOrders = []; // Clear selections when switching tabs
    
    if (browser) {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      history.pushState({}, "", url.toString());
    }
  }

  function toggleOrderSelection(orderId) {
    selectedOrders = selectedOrders.includes(orderId)
      ? selectedOrders.filter((id) => id !== orderId)
      : [...selectedOrders, orderId];
    // Update selectAll state
    selectAll = selectedOrders.length === pendingOrders.length;
  }

  function toggleSelectAll() {
    selectAll = !selectAll;
    selectedOrders = selectAll ? pendingOrders.map((order) => order.id) : [];
  }

  // Function to handle assignment
  function handleAssign({ detail }) {
    const { employeeId, orderIds } = detail;
    if (!employeeId || !orderIds || orderIds.length === 0) return;
    
    isLoading = true;
    const formData = new FormData();
    formData.append('employeeId', employeeId);
    formData.append('orderIds', orderIds.join(','));
    
    fetch('?/assignOrders', {
      method: 'POST',
      body: formData
    }).then(response => response.json())
      .then(result => {
        if (result.type === 'success') {
          selectedOrders = [];
          selectAll = false;
          selectedEmployee = null;
          reloadWithTab("in_progress");
        }
        isLoading = false;
      })
      .catch(error => {
        console.error('Error assigning orders:', error);
        isLoading = false;
      });
  }

  function sort(field) {
    if (sortField === field) {
      sortDirection = sortDirection === "asc" ? "desc" : "asc";
    } else {
      sortField = field;
      sortDirection = "asc";
    }
  }

  // Handle sorting for all tabs with improved handling
  function handleSort(event) {
    const field = event.detail.field;
    sort(field);
    
    // Log sorting action for debugging
    console.log(`Sorting by ${field} in ${sortDirection} direction`);
  }

  function resetForm() {
    selectedStudent = null;
    selectedUniformType = "upper";
    selectedDueDate = "";
    showCreateModal = false;
    showModal = false;
    isEditing = false;
    orderToEdit = null;
    searchTerm = "";
    isStudentDropdownOpen = false;
  }

  function handleCreateClick() {
    if (!isLoading) {
      showCreateModal = true;
    }
  }

  function handleEditClick(order) {
    isEditing = true;
    orderToEdit = order;
    showCreateModal = true;
  }

  function handleDeleteClick(order) {
    orderToDelete = order;
  }

  function handleRecordPayment(order) {
    if (!isLoading) {
      orderToPayment = order;
    }
  }

  function handleReceiptClick(order) {
    orderForReceipt = order;
  }

  function reloadWithTab(tab) {
    if (browser) {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      window.location.href = url.toString();
    }
  }

  // Set active tab from URL on page load
  $: {
    if (browser) {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam) {
        activeTab = tabParam;
      }
    }
  }

  // Event handlers for modals
  function handleCloseModal() {
    showModal = false;
  }

  function handleStudentSelect(event) {
    selectedStudent = event.detail.student;
    showModal = false;
  }

  function handleOrderModalSuccess(event) {
    resetForm();
    reloadWithTab("pending");
  }

  function handleOrderModalClose() {
    resetForm();
  }

  function handleDeleteSuccess() {
    orderToDelete = null;
    reloadWithTab("pending");
  }

  function handlePaymentSuccess() {
    orderToPayment = null;
    reloadWithTab("payments");
  }

  function handleReceiptModalClose() {
    orderForReceipt = null;
  }
</script>

<!-- Modals -->
{#if showModal}
  <StudentSearchModal 
    students={data.students} 
    {searchTerm}
    on:select={handleStudentSelect}
    on:close={handleCloseModal}
  />
{/if}

{#if showCreateModal}
  <CreateEditOrderModal
    {isEditing}
    orderToEdit={orderToEdit}
    students={data.students}
    uniformConfigs={data.uniformConfigs}
    {isLoading}
    on:success={handleOrderModalSuccess}
    on:close={handleOrderModalClose}
  />
{/if}

{#if orderToDelete}
  <DeleteOrderModal
    {orderToDelete}
    {isLoading}
    on:success={handleDeleteSuccess}
    on:close={() => orderToDelete = null}
  />
{/if}

{#if orderToPayment}
  <PaymentModal
    orderToPayment={orderToPayment}
    {isLoading}
    on:success={handlePaymentSuccess}
    on:close={() => orderToPayment = null}
  />
{/if}

{#if orderForReceipt}
  <ReceiptModal
    orderForReceipt={orderForReceipt}
    on:close={handleReceiptModalClose}
  />
{/if}

<!-- Main content -->
<div class="p-6">
  <div class="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0 mb-6">
    <!-- Header Section -->
    <div class="flex justify-between items-center">
      <div class="flex items-center gap-4">
        <div class="bg-primary/10 p-3 rounded-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="text-primary w-6 h-6"
            viewBox="0 0 16 16"
          >
            <path
              fill="currentColor"
              fill-rule="evenodd"
              d="M5.5 1a.5.5 0 0 0-.477.65l.11.35H3.5a.5.5 0 0 0-.5.5v12a.5.5 0 0 0 .5-.5h9a.5.5 0 0 0 .5-.5v-12a.5.5 0 0 0-.5-.5h-1.632l.11-.35A.5.5 0 0 0 10.5 1zm.68 1h3.64l-.313 1H6.493zM11 7H5V6h6zm0 2.5H5v-1h6zM5 12h4v-1H5z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
        <div>
          <h1 class="text-2xl font-bold text-gray-800">Orders Management</h1>
          <p class="text-sm text-gray-500">Manage orders and track payments</p>
        </div>
      </div>
    </div>
    <button
      class="w-full md:w-auto bg-primary text-white px-4 py-2 rounded-lg"
      on:click={handleCreateClick}
      disabled={isLoading}
    >
      Create New Order
    </button>
  </div>

  <div class="bg-white p-6 rounded-lg shadow-md">
    <!-- Search and filter controls -->
    <div class="flex flex-col md:flex-row justify-between gap-4 md:gap-0 mb-4">
      <h2 class="text-xl font-semibold">Orders List</h2>
      <input
        type="text"
        bind:value={searchTerm}
        placeholder="Search orders..."
        class="w-full md:w-auto border rounded p-2"
      />
    </div>

    <!-- Tab navigation -->
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
        Payments ({filteredPayments.length})
      </button>
    </div>

    <!-- Filter controls -->
    <div class="mb-6 bg-muted p-4 rounded-lg">
      <div class="mb-2 flex justify-between items-center">
        <h3 class="font-semibold text-gray-700">Date Filter</h3>
        {#if dateRange.start || dateRange.end || searchTerm}
          <button
            class="ml-auto px-3 py-1 text-xs text-gray-600 border rounded hover:bg-gray-50 flex items-center gap-1"
            on:click={resetAllFilters}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-3 w-3"
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
            Clear Filters
          </button>
        {/if}
      </div>
      
      <div class="flex items-center gap-2 flex-1">
  <input
    type="date"
    bind:value={dateRange.start}
    on:input={() => {
      // Changed from on:change to on:input for more immediate reactivity
      triggerFilterUpdate();
      // Reset to first page when filters change
      currentPage[activeTab] = 1;
      
      // If end date is now before start date, clear it
      if (dateRange.end && dateRange.end < dateRange.start) {
        dateRange.end = "";
      }
    }}
    class="border rounded p-2 flex-1"
    placeholder="Start date"
  />
  <span class="text-gray-500">to</span>
  <input
    type="date"
    bind:value={dateRange.end}
    min={dateRange.start || ""}
    on:input={() => {
      triggerFilterUpdate();
      currentPage[activeTab] = 1;
    }}
    class="border rounded p-2 flex-1"
    placeholder="End date"
    disabled={!dateRange.start}
  />
</div>
    </div>

    <!-- Tab content -->
    {#key filterUpdateTrigger}
      {#if activeTab === "pending"}
        <PendingOrdersTab 
          {pendingOrders}
          paginatedOrders={paginatedOrders.pending}
          {sortField}
          {sortDirection}
          {selectedOrders}
          {selectAll}
          {isLoading}
          employees={data.employees}
          currentPage={currentPage.pending}
          totalPages={totalPages.pending}
          on:toggleSelection={(e) => toggleOrderSelection(e.detail.orderId)}
          on:toggleSelectAll={toggleSelectAll}
          on:sort={handleSort}
          on:edit={(e) => handleEditClick(e.detail.order)}
          on:delete={(e) => handleDeleteClick(e.detail.order)}
          on:assign={handleAssign}
          on:pageChange={handlePageChange}
        />
      {:else if activeTab === "in_progress"}
        <InProgressOrdersTab 
          {inProgressOrders}
          paginatedOrders={paginatedOrders.in_progress}
          {sortField}
          {sortDirection}
          currentPage={currentPage.in_progress}
          totalPages={totalPages.in_progress}
          on:sort={handleSort}
          on:pageChange={handlePageChange}
        />
      {:else if activeTab === "completed"}
        <CompletedOrdersTab 
          {completedOrders}
          paginatedOrders={paginatedOrders.completed}
          {sortField}
          {sortDirection}
          currentPage={currentPage.completed}
          totalPages={totalPages.completed}
          on:sort={handleSort}
          on:pageChange={handlePageChange}
        />
      {:else if activeTab === "payments"}
        <PaymentsTab 
          orders={filteredPayments}
          paginatedOrders={paginatedOrders.payments}
          {sortField}
          {sortDirection}
          currentPage={currentPage.payments}
          totalPages={totalPages.payments}
          {isLoading}
          on:sort={handleSort}
          on:recordPayment={(e) => handleRecordPayment(e.detail.order)}
          on:generateReceipt={(e) => handleReceiptClick(e.detail.order)}
          on:pageChange={handlePageChange}
        />
      {/if}
    {/key}
  </div>
</div>