<script>
  import { format } from "date-fns";
  import { createEventDispatcher } from "svelte";

  export let pendingOrders = [];
  export let paginatedOrders = [];
  export let sortField = "created_at";
  export let sortDirection = "desc";
  export let selectedOrders = [];
  export let selectAll = false;
  export let isLoading = false;
  export let employees = [];
  export let currentPage = 1;
  export let totalPages = 1;

  const dispatch = createEventDispatcher();

  // State for employee selection dropdown
  let selectedEmployee = null;
  let employeeSearchTerm = "";
  let isEmployeeDropdownOpen = false;

  $: filteredEmployees = employees.filter((employee) =>
    `${employee.first_name} ${employee.last_name}`
      .toLowerCase()
      .includes(employeeSearchTerm.toLowerCase())
  );

  // Functions
  function toggleOrderSelection(orderId) {
    dispatch("toggleSelection", { orderId });
  }

  function toggleSelectAll() {
    dispatch("toggleSelectAll");
  }

  function selectEmployee(employee) {
    selectedEmployee = employee;
    employeeSearchTerm = `${employee.first_name} ${employee.last_name}`;
    isEmployeeDropdownOpen = false;
  }

  function getSortIcon(field) {
    if (sortField !== field) return "↕";
    return sortDirection === "asc" ? "↑" : "↓";
  }

  function sort(field) {
    dispatch("sort", { field });
  }

  function handleEditClick(order) {
    dispatch("edit", { order });
  }

  function handleDeleteClick(order) {
    dispatch("delete", { order });
  }

  function handleAssign() {
    dispatch("assign", { employeeId: selectedEmployee?.id, orderIds: selectedOrders });
  }

  function handlePageChange(event) {
    dispatch("pageChange", event.detail);
  }
</script>

<div>
  <!-- Assignment controls -->
  <div class="flex flex-row max-md:flex-col items-start md:items-center justify-between gap-4 mb-4 bg-muted p-4 rounded-lg">
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
          {selectedOrders.length} order{selectedOrders.length > 1 ? "s" : ""}
        </span>
      {/if}
    </div>

    {#if selectedOrders.length > 0}
      <form method="POST" action="?/assignOrders" class="flex gap-4 items-center max-md:flex-col">
        <div class="relative min-w-[250px]">
          <input
            type="text"
            bind:value={employeeSearchTerm}
            placeholder="Search tailor..."
            class="w-full p-2 border rounded {selectedEmployee ? 'bg-gray-50' : ''}"
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
            <div class="absolute z-50 mt-1 w-full bg-white rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {#if filteredEmployees.length > 0}
                {#each filteredEmployees as employee}
                  <div
                    class="p-3 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                    on:click={() => selectEmployee(employee)}
                  >
                    <div class="font-semibold">
                      {employee.first_name} {employee.last_name}
                    </div>
                    <div class="text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                      </svg>
                    </div>
                  </div>
                {/each}
              {:else}
                <p class="text-gray-500 text-center p-3">No employees found</p>
              {/if}
            </div>
          {/if}
        </div>
        <input type="hidden" name="employeeId" value={selectedEmployee?.id} />
        <input type="hidden" name="orderIds" value={selectedOrders.join(",")} />
        <button
          type="submit"
          on:click|preventDefault={handleAssign}
          class="bg-accent text-white px-4 py-2 rounded hover:bg-accent-hover transition-colors flex items-center gap-2 {isLoading || !selectedEmployee ? 'opacity-50 cursor-not-allowed' : ''}"
          disabled={!selectedEmployee || isLoading}
        >
          {#if isLoading}
            <div class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
          {/if}
          Assign Orders
        </button>
      </form>
    {/if}
  </div>

  <!-- Table -->
  <div class="overflow-x-auto -mx-6 md:mx-0">
    <div class="min-w-[800px] md:w-full p-6 md:p-0">
      <table class="w-full">
        <thead>
          <tr class="bg-muted max-md:whitespace-nowrap">
            <th class="p-2 w-12">Select</th>
            {#each ["id", "student", "uniform_type", "created_at", "due_date", "total_amount", "status"] as field}
              <th
                class="p-2 cursor-pointer hover:bg-gray-200 text-left"
                on:click={() => sort(field)}
              >
                {field === "created_at" ? "Ordered At" : field.charAt(0).toUpperCase() + field.slice(1).replace("_", " ")}
                {#if sortField === field}
                  <span class="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                {/if}
              </th>
            {/each}
            <th class="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each paginatedOrders as order}
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
              <td class="p-2">{order.student?.first_name} {order.student?.last_name}</td>
              <td class="p-2">{order.uniform_type}</td>
              <td class="p-2">{format(new Date(order.created_at), "MMM d, yyyy h:mm a")}</td>
              <td class="p-2">{format(new Date(order.due_date), "MMM d, yyyy")}</td>
              <td class="p-2">₱{order.total_amount}</td>
              <td class="p-2">
                <span class={`px-2 py-1 rounded-full text-sm ${
                  order.status === "completed" ? "bg-green-100 text-green-800" :
                  order.status === "in progress" ? "bg-blue-100 text-blue-800" :
                  "bg-yellow-100 text-yellow-800"
                }`}>
                  {order.status}
                </span>
              </td>
              <td class="p-2">
                <div class="flex gap-2">
                  <button class="text-blue-600 hover:text-blue-800" on:click={() => handleEditClick(order)}>
                    Edit
                  </button>
                  <button class="text-red-600 hover:text-red-800" on:click={() => handleDeleteClick(order)}>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
      
      <!-- Pagination controls -->
      <div class="flex items-center justify-between px-4 py-3 border-t">
        <div class="flex items-center text-sm text-gray-500">
          Showing {(currentPage - 1) * paginatedOrders.length + 1} to {Math.min(currentPage * paginatedOrders.length, pendingOrders.length)} of {pendingOrders.length} entries
        </div>
        <div class="flex items-center gap-2">
          <button
            class="px-3 py-1 rounded border {currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:bg-gray-50'}"
            on:click={() => dispatch('pageChange', { action: 'prev' })}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          
          {#each Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1) as pageNum}
            <button
              class="px-3 py-1 rounded border {currentPage === pageNum ? 'bg-primary text-white' : 'hover:bg-gray-50'}"
              on:click={() => dispatch('pageChange', { action: 'goto', page: pageNum })}
            >
              {pageNum}
            </button>
          {/each}
          
          <button
            class="px-3 py-1 rounded border {currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:bg-gray-50'}"
            on:click={() => dispatch('pageChange', { action: 'next' })}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
