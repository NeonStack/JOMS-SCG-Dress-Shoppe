<script>
    let payments = [
      { student: 'John Doe', amount: 150, status: 'Paid', date: '2024-10-01' },
      { student: 'Jane Smith', amount: 100, status: 'Overdue', date: '2024-09-15' }
    ];
  
    function createPayment() {
      // Logic for creating a new payment entry
    }
  </script>
  
  <div class="space-y-8">
    <!-- Payment List -->
    <div class="bg-primary-light p-4 rounded-lg shadow">
      <h2 class="text-2xl font-bold mb-2">Payment List</h2>
      <ul>
        {#each payments as payment}
          <li>
            {payment.student} - ${payment.amount}, {payment.status} (Paid on: {payment.date})
            <button class="ml-4 text-sm bg-primary-dark text-white px-2 py-1 rounded">Edit</button>
          </li>
        {/each}
      </ul>
    </div>
  
    <!-- Add New Payment -->
    <div class="bg-primary-light p-4 rounded-lg shadow">
      <h2 class="text-2xl font-bold mb-2">Add New Payment</h2>
      <form on:submit|preventDefault={createPayment}>
        <input type="text" placeholder="Student Name" class="w-full p-2 mb-2 border rounded" />
        <input type="number" placeholder="Amount" class="w-full p-2 mb-2 border rounded" />
        <select class="w-full p-2 mb-2 border rounded">
          <option value="Paid">Paid</option>
          <option value="Overdue">Overdue</option>
        </select>
        <button type="submit" class="p-2 bg-primary-dark text-white rounded">Add Payment</button>
      </form>
    </div>
  </div>
  