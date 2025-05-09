<script>
  import { enhance } from "$app/forms";
  import { createEventDispatcher } from "svelte";

  export let orderToPayment = null;
  export let isLoading = false;

  let paymentAmount = "";

  const dispatch = createEventDispatcher();

  function closeModal() {
    dispatch("close");
  }

  const handleSubmit = () => {
    return async ({ result }) => {
      if (result.type === "success") {
        dispatch("success");
      }
    };
  };
</script>

<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
  <div class="bg-white rounded-2xl w-[500px] max-h-[90vh] overflow-auto">
    <!-- Header Section -->
    <div class="bg-primary text-white px-8 py-6">
      <div class="flex justify-between items-center">
        <h2 class="text-2xl font-bold">Record Payment</h2>
        <button
          class="text-white hover:text-gray-200 transition-colors"
          on:click={closeModal}
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
          <div class="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
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
              {orderToPayment.student?.first_name} {orderToPayment.student?.last_name}
            </h3>
            <p class="text-gray-600 text-sm">Student</p>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-4 mt-4">
          <div class="bg-white p-4 rounded-lg shadow-sm">
            <p class="text-sm text-gray-600">Total Amount</p>
            <p class="text-lg font-bold text-primary">₱{orderToPayment.total_amount}</p>
          </div>
          <div class="bg-white p-4 rounded-lg shadow-sm">
            <p class="text-sm text-gray-600">Amount Paid</p>
            <p class="text-lg font-bold text-green-600">₱{orderToPayment.amount_paid}</p>
          </div>
          <div class="bg-white p-4 rounded-lg shadow-sm">
            <p class="text-sm text-gray-600">Balance</p>
            <p class="text-lg font-bold text-red-600">₱{orderToPayment.balance}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Payment Form Section -->
    <form
      method="POST"
      action="?/updatePayment"
      use:enhance={handleSubmit}
      class="px-8 py-6 space-y-6"
    >
      <input type="hidden" name="orderId" value={orderToPayment.id} />

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Payment Amount</label>
        <div class="relative">
          <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
          <input
            type="number"
            name="amountPaid"
            bind:value={paymentAmount}
            step="1"
            min={orderToPayment.amount_paid === 0 ? 0 : -orderToPayment.amount_paid}
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
            {@const newTotal = orderToPayment.amount_paid + parseFloat(paymentAmount)}
            {#if newTotal > orderToPayment.total_amount}
              <div class="flex justify-between text-primary font-semibold border-t pt-2">
                <span>Change:</span>
                <span>₱{(newTotal - orderToPayment.total_amount).toFixed(2)}</span>
              </div>
              <p class="text-sm text-primary">
                Note: Only ₱{(orderToPayment.total_amount - orderToPayment.amount_paid).toFixed(2)} will be recorded
              </p>
            {:else}
              <div class="flex justify-between font-semibold border-t pt-2">
                <span>Remaining Balance:</span>
                <span>₱{(orderToPayment.total_amount - newTotal).toFixed(2)}</span>
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
          on:click={closeModal}
        >
          Cancel
        </button>
        <button
          type="submit"
          class="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2 {isLoading ? 'opacity-50 cursor-not-allowed' : ''}"
          disabled={isLoading}
        >
          {#if isLoading}
            <div class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
          {/if}
          Record Payment
        </button>
      </div>
    </form>
  </div>
</div>
