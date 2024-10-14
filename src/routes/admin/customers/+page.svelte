<script>
  import { onMount } from "svelte";

  let customers = [
    {
      id: 1,
      name: "John Doe",
      year: "3rd Year",
      course: "BSCS",
      gender: "Male",
      email: "john.doe@example.com",
    },
    {
      id: 2,
      name: "Jane Smith",
      year: "2nd Year",
      course: "BSIT",
      gender: "Female",
      email: "jane.smith@example.com",
    },
    {
      id: 3,
      name: "Jane Philip Smith",
      year: "2nd Year",
      course: "BSIT",
      gender: "Female",
      email: "jane.smiths@example.com",
    },
    // Add more customers here
  ];

  let searchTerm = "";
  let filteredCustomers = customers;
  let sortField = "name";
  let sortOrder = "asc";
  let newCustomer = { name: "", year: "", course: "", gender: "", email: "" };
  let editingCustomer = null;

  $: {
    filteredCustomers = customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.year.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.gender.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filteredCustomers.sort((a, b) => {
      if (a[sortField] < b[sortField]) return sortOrder === "asc" ? -1 : 1;
      if (a[sortField] > b[sortField]) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }

  function toggleSort(field) {
    if (sortField === field) {
      sortOrder = sortOrder === "asc" ? "desc" : "asc";
    } else {
      sortField = field;
      sortOrder = "asc";
    }
  }

  function addCustomer() {
    if (
      newCustomer.name &&
      newCustomer.year &&
      newCustomer.course &&
      newCustomer.gender &&
      newCustomer.email
    ) {
      customers = [...customers, { id: customers.length + 1, ...newCustomer }];
      newCustomer = { name: "", year: "", course: "", gender: "", email: "" };
    }
  }

  function editCustomer(customer) {
    editingCustomer = { ...customer };
  }

  function updateCustomer() {
    if (editingCustomer) {
      customers = customers.map((c) =>
        c.id === editingCustomer.id ? editingCustomer : c
      );
      editingCustomer = null;
    }
  }

  function deleteCustomer(id) {
    if (confirm("Are you sure you want to delete this customer?")) {
      customers = customers.filter((c) => c.id !== id);
    }
  }

  onMount(() => {
    // Here you would typically fetch customers from your Supabase backend
    // For example:
    // async function fetchCustomers() {
    //   const { data, error } = await supabase.from('customers').select('*');
    //   if (data) customers = data;
    // }
    // fetchCustomers();
  });
</script>

<div class="p-6">
  <h1 class="text-3xl font-bold mb-6">Customer Information</h1>

  <!-- Search Form -->
  <div class="flex space-x-2">
    <input
      type="text"
      placeholder="Search by name, year level, course, gender, email..."
      class="w-full p-2 border rounded"
      bind:value={searchTerm}
    />
  </div>

  <!-- Customer List -->
  <div class="bg-white p-4 rounded-lg shadow">
    <h2 class="text-2xl font-bold mb-4">Customer List</h2>
    <div class="overflow-x-auto">
      <table class="min-w-full">
        <thead>
          <tr class="text-left">
            <th class="cursor-pointer" on:click={() => toggleSort("name")}
              >Name {sortField === "name"
                ? sortOrder === "asc"
                  ? "▲"
                  : "▼"
                : ""}</th
            >
            <th class="cursor-pointer" on:click={() => toggleSort("year")}
              >Year {sortField === "year"
                ? sortOrder === "asc"
                  ? "▲"
                  : "▼"
                : ""}</th
            >
            <th class="cursor-pointer" on:click={() => toggleSort("course")}
              >Course {sortField === "course"
                ? sortOrder === "asc"
                  ? "▲"
                  : "▼"
                : ""}</th
            >
            <th class="cursor-pointer" on:click={() => toggleSort("gender")}
              >Gender {sortField === "gender"
                ? sortOrder === "asc"
                  ? "▲"
                  : "▼"
                : ""}</th
            >
            <th class="cursor-pointer" on:click={() => toggleSort("email")}
              >Email {sortField === "email"
                ? sortOrder === "asc"
                  ? "▲"
                  : "▼"
                : ""}</th
            >
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each filteredCustomers as customer}
            <tr>
              <td>{customer.name}</td>
              <td>{customer.year}</td>
              <td>{customer.course}</td>
              <td>{customer.gender}</td>
              <td>{customer.email}</td>
              <td>
                <button
                  on:click={() => editCustomer(customer)}
                  class="mr-2 text-sm bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded"
                  >Edit</button
                >
                <button
                  on:click={() => deleteCustomer(customer.id)}
                  class="text-sm bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded"
                  >Delete</button
                >
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>

  <!-- Add New Customer -->
  <div class="bg-white p-4 rounded-lg shadow">
    <h2 class="text-2xl font-bold mb-4">Add New Customer</h2>
    <form on:submit|preventDefault={addCustomer} class="space-y-4">
      <input
        bind:value={newCustomer.name}
        type="text"
        placeholder="Name"
        class="w-full p-2 border rounded"
        required
      />
      <input
        bind:value={newCustomer.year}
        type="text"
        placeholder="Year Level"
        class="w-full p-2 border rounded"
        required
      />
      <input
        bind:value={newCustomer.course}
        type="text"
        placeholder="Course"
        class="w-full p-2 border rounded"
        required
      />
      <select
        bind:value={newCustomer.gender}
        class="w-full p-2 border rounded"
        required
      >
        <option value="">Select Gender</option>
        <option value="Male">Male</option>
        <option value="Female">Female</option>
        <option value="Other">Other</option>
      </select>
      <input
        bind:value={newCustomer.email}
        type="email"
        placeholder="Email"
        class="w-full p-2 border rounded"
        required
      />
      <button
        type="submit"
        class="w-full p-2 bg-green-500 hover:bg-green-600 text-white rounded"
        >Add Customer</button
      >
    </form>
  </div>

  <!-- Edit Customer Modal -->
  {#if editingCustomer}
    <div
      class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full"
      id="my-modal"
    >
      <div
        class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white"
      >
        <h3 class="text-lg font-bold mb-4">Edit Customer</h3>
        <form on:submit|preventDefault={updateCustomer} class="space-y-4">
          <input
            bind:value={editingCustomer.name}
            type="text"
            placeholder="Name"
            class="w-full p-2 border rounded"
            required
          />
          <input
            bind:value={editingCustomer.year}
            type="text"
            placeholder="Year Level"
            class="w-full p-2 border rounded"
            required
          />
          <input
            bind:value={editingCustomer.course}
            type="text"
            placeholder="Course"
            class="w-full p-2 border rounded"
            required
          />
          <select
            bind:value={editingCustomer.gender}
            class="w-full p-2 border rounded"
            required
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          <input
            bind:value={editingCustomer.email}
            type="email"
            placeholder="Email"
            class="w-full p-2 border rounded"
            required
          />
          <div class="flex justify-end space-x-2">
            <button
              type="button"
              on:click={() => (editingCustomer = null)}
              class="px-4 py-2 bg-gray-300 text-gray-700 rounded">Cancel</button
            >
            <button
              type="submit"
              class="px-4 py-2 bg-blue-500 text-white rounded">Update</button
            >
          </div>
        </form>
      </div>
    </div>
  {/if}
</div>

<style>
  td,
  th {
    padding: 7px;
    border: 1px solid black;
  }

  tr:nth-child(even) {
    @apply bg-muted;
  }
</style>
