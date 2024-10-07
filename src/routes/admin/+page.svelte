// src/routes/admin/+page.svelte
<script>
  import { onMount } from 'svelte';
  import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
  
  const data = [
    { month: 'Jan', revenue: 4000 },
    { month: 'Feb', revenue: 3000 },
    { month: 'Mar', revenue: 5000 },
    { month: 'Apr', revenue: 4500 },
    { month: 'May', revenue: 6000 },
    { month: 'Jun', revenue: 5500 },
  ];

  let mounted = false;

  onMount(() => {
    mounted = true;
  });
</script>

<div class="space-y-6">
  <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
  
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <!-- Job Orders Card -->
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Job Orders</h2>
      <div class="grid grid-cols-3 gap-4">
        <div class="text-center">
          <span class="block text-2xl font-bold text-blue-600">15</span>
          <span class="text-sm text-gray-500">Ongoing</span>
        </div>
        <div class="text-center">
          <span class="block text-2xl font-bold text-yellow-600">8</span>
          <span class="text-sm text-gray-500">Upcoming</span>
        </div>
        <div class="text-center">
          <span class="block text-2xl font-bold text-green-600">42</span>
          <span class="text-sm text-gray-500">Completed</span>
        </div>
      </div>
    </div>

    <!-- Revenue Card -->
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Revenue</h2>
      <div class="text-3xl font-bold text-gray-900">₱45,850</div>
      <div class="text-sm text-gray-500">This month</div>
    </div>

    <!-- Tasks Card -->
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Tasks</h2>
      <div class="space-y-2">
        <div class="flex justify-between items-center">
          <span class="text-sm text-gray-500">In Progress</span>
          <span class="text-sm font-semibold text-gray-900">12</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div class="bg-blue-600 h-2 rounded-full" style="width: 45%"></div>
        </div>
      </div>
    </div>
  </div>

  <!-- Revenue Chart -->
  {#if mounted}
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Revenue Overview</h2>
      <div class="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="revenue" stroke="#3B82F6" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  {/if}
</div>