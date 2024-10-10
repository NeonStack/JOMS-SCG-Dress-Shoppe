<script>
  let customers = [
    { name: 'John Doe', year: '3rd Year', course: 'BSCS' },
    { name: 'Jane Smith', year: '2nd Year', course: 'BSIT' },
    // Add more customers here
  ];

  let searchTerm = '';
  let filteredCustomers = customers;

  function search() {
    filteredCustomers = customers.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.year.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.course.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  function addCustomer() {
    // Logic for adding a new customer
    
  }
</script>

<div class="space-y-8">
  <!-- Search Form -->
  <div class="flex space-x-2">
    <input
      type="text"
      placeholder="Search by name, year level, course..."
      class="w-full p-2 border rounded"
      bind:value={searchTerm}
      on:input={search}
    />
    <button class="bg-primary-dark text-white p-2 rounded">Search</button>
  </div>

  <!-- Customer List -->
  <div class="bg-primary-light p-4 rounded-lg shadow">
    <h2 class="text-2xl font-bold mb-2">Customer List</h2>
    <ul>
      {#each filteredCustomers as customer}
        <li>
          {customer.name} - {customer.year}, {customer.course}
          <button class="ml-4 text-sm bg-primary-dark text-white px-2 py-1 rounded">Edit</button>
        </li>
      {/each}
    </ul>
  </div>

  <!-- Add New Customer -->
  <div class="bg-primary-light p-4 rounded-lg shadow">
    <h2 class="text-2xl font-bold mb-2">Add New Customer</h2>
    <form on:submit|preventDefault={addCustomer}>
      <input type="text" placeholder="Name" class="w-full p-2 mb-2 border rounded" />
      <input type="text" placeholder="Year Level" class="w-full p-2 mb-2 border rounded" />
      <input type="text" placeholder="Course" class="w-full p-2 mb-2 border rounded" />
      <button type="submit" class="p-2 bg-primary-dark text-white rounded">Add Customer</button>
    </form>
  </div>
</div>
