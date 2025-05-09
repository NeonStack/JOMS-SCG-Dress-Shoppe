<script>
  import { format } from "date-fns";
  import { createEventDispatcher } from "svelte";
  
  export let orders = [];
  export let paginatedOrders = [];
  export let sortField = "payment_date";
  export let sortDirection = "desc";
  export let currentPage = 1;
  export let totalPages = 1;
  export let isLoading = false;
  
  const dispatch = createEventDispatcher();
  
  function displayPaymentStatus(order) {
    if (order.amount_paid === 0) return "Not Paid";
    if (order.amount_paid >= order.total_amount) return "Fully Paid";
    return "Partial";
  }
  
  function formatPaymentDate(date) {
    return date 
      ? format(new Date(date), "MMM d, yyyy")
      : "No payment";
  }
  
  function sort(field) {
    dispatch("sort", { field });
  }
  
  function handleRecordPayment(order) {
    if (!isLoading) {
      dispatch("recordPayment", { order });
    }
  }
  
  function handleReceiptClick(order) {
    dispatch("generateReceipt", { order });
  }
</script>

<div>
  <!-- Table -->
  <div class="overflow-x-auto -mx-6 md:mx-0">
    <div class="min-w-[800px] md:w-full p-6 md:p-0">
      <table class="w-full">
        <thead>
          <tr class="bg-muted max-md:whitespace-nowrap">
            {#each ["id", "student", "status", "total_amount", "amount_paid", "balance", "payment_date", "payment_status", "payment_updated_by"] as field}
              <th 
                class="p-2 cursor-pointer hover:bg-gray-200 text-left" 
                on:click={() => sort(field.toLowerCase())}
              >
                {field === "total_amount" ? "Total" : 
                 field === "amount_paid" ? "Paid" : 
                 field === "payment_date" ? "Last Payment" : 
                 field === "payment_status" ? "Payment Status" : 
                 field === "payment_updated_by" ? "Updated By" : 
                 field.charAt(0).toUpperCase() + field.slice(1).replace("_", " ")}
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
              <td class="p-2">{order.id}</td>
              <td class="p-2">{order.student?.first_name} {order.student?.last_name}</td>
              <td class="p-2">
                <span class={`px-2 py-1 rounded-full text-sm
                  ${order.status === "completed" ? "bg-green-100 text-green-800" : 
                   order.status === "in progress" ? "bg-blue-100 text-blue-800" : 
                   "bg-yellow-100 text-yellow-800"}`}>
                  {order.status}
                </span>
              </td>
              <td class="p-2">₱{order.total_amount}</td>
              <td class="p-2">₱{order.amount_paid}</td>
              <td class="p-2">₱{order.balance}</td>
              <td class="p-2">{formatPaymentDate(order.payment_date)}</td>
              <td class="p-2">
                <span class={`px-2 py-1 rounded-full text-sm
                  ${displayPaymentStatus(order) === "Fully Paid" ? "bg-green-100 text-green-800" : 
                   displayPaymentStatus(order) === "Partial" ? "bg-yellow-100 text-yellow-800" : 
                   "bg-red-100 text-red-800"}`}>
                  {displayPaymentStatus(order)}
                </span>
              </td>
              <td class="p-2">{order.payment_updated_by || "-"}</td>
              <td class="p-2">
                <div class="flex gap-2">
                  <button 
                    class="text-blue-600 hover:text-blue-800 {isLoading ? 'opacity-50 cursor-not-allowed' : ''}" 
                    on:click={() => handleRecordPayment(order)}
                    disabled={isLoading}
                  >
                    Payment
                  </button>
                  <button 
                    class="text-green-600 hover:text-green-800" 
                    on:click={() => handleReceiptClick(order)}
                  >
                    Receipt
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
          Showing {orders.length > 0 ? (currentPage - 1) * paginatedOrders.length + 1 : 0} to {Math.min(currentPage * paginatedOrders.length, orders.length)} of {orders.length} entries
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
