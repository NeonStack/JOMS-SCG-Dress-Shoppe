<script>
  import { format } from "date-fns";
  import { createEventDispatcher } from "svelte";

  export let completedOrders = [];
  export let paginatedOrders = [];
  export let sortField = "created_at";
  export let sortDirection = "desc";
  export let currentPage = 1;
  export let totalPages = 1;

  const dispatch = createEventDispatcher();

  function sort(field) {
    dispatch("sort", { field });
  }

  function getSortIcon(field) {
    if (sortField !== field) return "↕";
    return sortDirection === "asc" ? "↑" : "↓";
  }
</script>

<div>
  <!-- Table -->
  <div class="overflow-x-auto -mx-6 md:mx-0">
    <div class="min-w-[800px] md:w-full p-6 md:p-0">
      <table class="w-full">
        <thead>
          <tr class="bg-muted max-md:whitespace-nowrap">
            {#each ["id", "student", "uniform_type", "created_at", "due_date", "total_amount", "status"] as field}
              <th
                class="p-2 cursor-pointer hover:bg-gray-200 text-left"
                on:click={() => sort(field)}
              >
                {field === "id" ? "Order ID" : 
                 field === "created_at" ? "Ordered At" : 
                 field.charAt(0).toUpperCase() + field.slice(1).replace("_", " ")}
                {#if sortField === field}
                  <span class="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                {/if}
              </th>
            {/each}
            <th class="p-2">Assigned To</th>
            <th class="p-2">Assigned By</th>
          </tr>
        </thead>
        <tbody>
          {#each paginatedOrders as order}
            <tr class="border-b hover:bg-muted">
              <td class="p-2">{order.id}</td>
              <td class="p-2">
                <div>
                  <span class="font-medium">{order.student?.first_name} {order.student?.last_name}</span>
                  <span class="text-xs text-gray-500 block">ID: {order.student?.id}</span>
                </div>
              </td>
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
                {#if order.employee}
                  {order.employee.first_name} {order.employee.last_name}
                {:else}
                  <span class="text-gray-400">Unassigned</span>
                {/if}
              </td>
              <td class="p-2">{order.assigned_by || "-"}</td>
            </tr>
          {/each}
        </tbody>
      </table>
      
      <!-- Pagination controls -->
      <div class="flex items-center justify-between px-4 py-3 border-t">
        <div class="flex items-center text-sm text-gray-500">
          Showing {(currentPage - 1) * paginatedOrders.length + 1} to {Math.min(currentPage * paginatedOrders.length, completedOrders.length)} of {completedOrders.length} entries
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
