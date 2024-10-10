<script>
    let jobOrders = [
      { id: 1, student: 'John Doe', status: 'In Progress', dueDate: '2024-10-15' },
      { id: 2, student: 'Jane Smith', status: 'Completed', dueDate: '2024-09-30' }
    ];
  
    function createJobOrder() {
      // Logic for creating a new job order
    }
  </script>
  
  <div class="space-y-8">
    <!-- Job Order List -->
    <div class="bg-primary-light p-4 rounded-lg shadow">
      <h2 class="text-2xl font-bold mb-2">Job Orders</h2>
      <ul>
        {#each jobOrders as order}
          <li>
            {order.student} - {order.status}, Due: {order.dueDate}
            <button class="ml-4 text-sm bg-primary-dark text-white px-2 py-1 rounded">Edit</button>
          </li>
        {/each}
      </ul>
    </div>
  
    <!-- Create New Job Order -->
    <div class="bg-primary-light p-4 rounded-lg shadow">
      <h2 class="text-2xl font-bold mb-2">Create New Job Order</h2>
      <form on:submit|preventDefault={createJobOrder}>
        <input type="text" placeholder="Student Name" class="w-full p-2 mb-2 border rounded" />
        <input type="date" placeholder="Due Date" class="w-full p-2 mb-2 border rounded" />
        <select class="w-full p-2 mb-2 border rounded">
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
        <button type="submit" class="p-2 bg-primary-dark text-white rounded">Create Job Order</button>
      </form>
    </div>
  </div>
  