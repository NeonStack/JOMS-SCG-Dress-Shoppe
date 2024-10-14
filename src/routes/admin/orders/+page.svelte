<script>
  import { onMount } from 'svelte';

  let jobOrders = [
    { id: 1, student: 'John Doe', status: 'In Progress', dueDate: '2024-10-15', assignedTo: 'Employee 1', details: 'Polo and Slacks', measurements: 'Chest: 40", Waist: 32"' },
    { id: 2, student: 'Jane Smith', status: 'Completed', dueDate: '2024-09-30', assignedTo: 'Employee 2', details: 'Blouse and Skirt', measurements: 'Bust: 36", Waist: 28"' }
  ];

  let employees = [
    { id: 1, name: 'Employee 1' },
    { id: 2, name: 'Employee 2' },
    { id: 3, name: 'Employee 3' }
  ];

  let newJobOrder = {
    student: '',
    status: 'In Progress',
    dueDate: '',
    assignedTo: '',
    details: '',
    measurements: ''
  };

  let editingJobOrder = null;
  let searchTerm = '';
  let sortField = 'dueDate';
  let sortOrder = 'asc';

  $: filteredJobOrders = jobOrders
    .filter(order => 
      order.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.assignedTo.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (a[sortField] < b[sortField]) return sortOrder === 'asc' ? -1 : 1;
      if (a[sortField] > b[sortField]) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  function createJobOrder() {
    if (newJobOrder.student && newJobOrder.dueDate && newJobOrder.assignedTo) {
      jobOrders = [...jobOrders, { id: jobOrders.length + 1, ...newJobOrder }];
      newJobOrder = {
        student: '',
        status: 'In Progress',
        dueDate: '',
        assignedTo: '',
        details: '',
        measurements: ''
      };
    }
  }

  function editJobOrder(order) {
    editingJobOrder = { ...order };
  }

  function updateJobOrder() {
    if (editingJobOrder) {
      jobOrders = jobOrders.map(order => order.id === editingJobOrder.id ? editingJobOrder : order);
      editingJobOrder = null;
    }
  }

  function deleteJobOrder(id) {
    if (confirm('Are you sure you want to delete this job order?')) {
      jobOrders = jobOrders.filter(order => order.id !== id);
    }
  }

  function toggleSort(field) {
    if (sortField === field) {
      sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      sortField = field;
      sortOrder = 'asc';
    }
  }

  onMount(() => {
    // Here you would typically fetch job orders and employees from your Supabase backend
    // For example:
    // async function fetchJobOrders() {
    //   const { data, error } = await supabase.from('job_orders').select('*');
    //   if (data) jobOrders = data;
    // }
    // fetchJobOrders();
  });
</script>

<div class="space-y-8 p-6">
  <h1 class="text-3xl font-bold mb-6">Job Orders Management</h1>

  <!-- Search and Filter -->
  <div class="flex space-x-2">
    <input
      type="text"
      placeholder="Search by student, status, or assigned employee..."
      class="w-full p-2 border rounded"
      bind:value={searchTerm}
    />
  </div>

  <!-- Job Order List -->
  <div class="bg-white p-4 rounded-lg shadow">
    <h2 class="text-2xl font-bold mb-4">Job Orders</h2>
    <div class="overflow-x-auto">
      <table class="min-w-full">
        <thead>
          <tr>
            <th class="cursor-pointer" on:click={() => toggleSort('student')}>Student {sortField === 'student' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}</th>
            <th class="cursor-pointer" on:click={() => toggleSort('status')}>Status {sortField === 'status' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}</th>
            <th class="cursor-pointer" on:click={() => toggleSort('dueDate')}>Due Date {sortField === 'dueDate' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}</th>
            <th class="cursor-pointer" on:click={() => toggleSort('assignedTo')}>Assigned To {sortField === 'assignedTo' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}</th>
            <th>Details</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each filteredJobOrders as order}
            <tr>
              <td>{order.student}</td>
              <td>{order.status}</td>
              <td>{order.dueDate}</td>
              <td>{order.assignedTo}</td>
              <td>{order.details}</td>
              <td>
                <button on:click={() => editJobOrder(order)} class="mr-2 text-sm bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded">Edit</button>
                <button on:click={() => deleteJobOrder(order.id)} class="text-sm bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded">Delete</button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>

  <!-- Create New Job Order -->
  <div class="bg-white p-4 rounded-lg shadow">
    <h2 class="text-2xl font-bold mb-4">Create New Job Order</h2>
    <form on:submit|preventDefault={createJobOrder} class="space-y-4">
      <input bind:value={newJobOrder.student} type="text" placeholder="Student Name" class="w-full p-2 border rounded" required />
      <input bind:value={newJobOrder.dueDate} type="date" class="w-full p-2 border rounded" required />
      <select bind:value={newJobOrder.status} class="w-full p-2 border rounded" required>
        <option value="In Progress">In Progress</option>
        <option value="Completed">Completed</option>
      </select>
      <select bind:value={newJobOrder.assignedTo} class="w-full p-2 border rounded" required>
        <option value="">Assign to Employee</option>
        {#each employees as employee}
          <option value={employee.name}>{employee.name}</option>
        {/each}
      </select>
      <textarea bind:value={newJobOrder.details} placeholder="Order Details" class="w-full p-2 border rounded" rows="3" required></textarea>
      <textarea bind:value={newJobOrder.measurements} placeholder="Measurements" class="w-full p-2 border rounded" rows="3" required></textarea>
      <button type="submit" class="w-full p-2 bg-green-500 hover:bg-green-600 text-white rounded">Create Job Order</button>
    </form>
  </div>

  <!-- Edit Job Order Modal -->
  {#if editingJobOrder}
    <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" id="my-modal">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <h3 class="text-lg font-bold mb-4">Edit Job Order</h3>
        <form on:submit|preventDefault={updateJobOrder} class="space-y-4">
          <input bind:value={editingJobOrder.student} type="text" placeholder="Student Name" class="w-full p-2 border rounded" required />
          <input bind:value={editingJobOrder.dueDate} type="date" class="w-full p-2 border rounded" required />
          <select bind:value={editingJobOrder.status} class="w-full p-2 border rounded" required>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
          <select bind:value={editingJobOrder.assignedTo} class="w-full p-2 border rounded" required>
            {#each employees as employee}
              <option value={employee.name}>{employee.name}</option>
            {/each}
          </select>
          <textarea bind:value={editingJobOrder.details} placeholder="Order Details" class="w-full p-2 border rounded" rows="3" required></textarea>
          <textarea bind:value={editingJobOrder.measurements} placeholder="Measurements" class="w-full p-2 border rounded" rows="3" required></textarea>
          <div class="flex justify-end space-x-2">
            <button type="button" on:click={() => editingJobOrder = null} class="px-4 py-2 bg-gray-300 text-gray-700 rounded">Cancel</button>
            <button type="submit" class="px-4 py-2 bg-blue-500 text-white rounded">Update</button>
          </div>
        </form>
      </div>
    </div>
  {/if}
</div>

<style>
  /* You can add any additional custom styles here */
</style>