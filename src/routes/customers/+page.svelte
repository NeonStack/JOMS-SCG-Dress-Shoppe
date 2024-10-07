<script>
    let customers = [
      { id: 1, name: 'John Doe', year: '3rd Year', course: 'Computer Science' },
      { id: 2, name: 'Jane Smith', year: '2nd Year', course: 'Engineering' },
      { id: 3, name: 'Alice Johnson', year: '4th Year', course: 'Business' },
    ];
  
    let searchTerm = '';
    let yearFilter = 'all';
  
    $: filteredCustomers = customers.filter(customer => {
      const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesYear = yearFilter === 'all' || customer.year === yearFilter;
      return matchesSearch && matchesYear;
    });
  </script>
  
  <div class="space-y-4">
    <div class="flex flex-col justify-between gap-4 sm:flex-row">
      <div class="flex-1">
        <input
          type="text"
          placeholder="Search customers..."
          bind:value={searchTerm}
          class="w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none"
        />
      </div>
      <div class="flex gap-4">
        <select
          bind:value={yearFilter}
          class="rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none"
        >
          <option value="all">All Years</option>
          <option value="1st Year">1st Year</option>
          <option value="2nd Year">2nd Year</option>
          <option value="3rd Year">3rd Year</option>
          <option value="4th Year">4th Year</option>
        </select>
        <button class="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
          Add Customer
        </button>
      </div>
    </div>
  
    <div class="overflow-x-auto rounded-lg bg-white shadow">
      <table class="w-full">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Name
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Year Level
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Course
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 bg-white">
          {#each filteredCustomers as customer}
            <tr>
              <td class="whitespace-nowrap px-6 py-4">
                <div class="text-sm font-medium text-gray-900">{customer.name}</div>
              </td>
              <td class="whitespace-nowrap px-6 py-4">
                <div class="text-sm text-gray-500">{customer.year}</div>
              </td>
              <td class="whitespace-nowrap px-6 py-4">
                <div class="text-sm text-gray-500">{customer.course}</div>
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-sm font-medium">
                <button class="text-blue-600 hover:text-blue-900">Edit</button>
                <button class="ml-4 text-red-600 hover:text-red-900">Delete</button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>