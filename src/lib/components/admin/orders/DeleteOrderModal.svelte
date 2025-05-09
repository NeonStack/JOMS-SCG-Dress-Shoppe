<script>
  import { enhance } from "$app/forms";
  import { createEventDispatcher } from "svelte";

  export let orderToDelete = null;
  export let isLoading = false;

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
  <div class="bg-white p-6 rounded-lg w-[400px]">
    <h2 class="text-xl font-bold mb-4">Delete Order</h2>
    <p class="mb-6 text-gray-600">
      Are you sure you want to delete this order? This action cannot be undone.
    </p>

    <form
      method="POST"
      action="?/deleteOrder"
      use:enhance={handleSubmit}
      class="flex justify-end gap-3"
    >
      <input type="hidden" name="orderId" value={orderToDelete.id} />
      <button
        type="button"
        class="px-4 py-2 border rounded hover:bg-gray-50"
        on:click={closeModal}
      >
        Cancel
      </button>
      <button
        type="submit"
        class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2 {isLoading ? 'opacity-50 cursor-not-allowed' : ''}"
        disabled={isLoading}
      >
        {#if isLoading}
          <div class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
        {/if}
        Delete
      </button>
    </form>
  </div>
</div>
