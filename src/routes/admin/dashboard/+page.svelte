<script>
  import { onMount } from 'svelte';
  import Chart from 'chart.js/auto';

  let recentOrdersChart;
  let employeeProductivityChart;
  let dailyRevenueChart;

  let totalOrders = 0;
  let pendingPayments = 0;
  let upcomingOrders = 0;
  let dailyRevenue = 0;

  // Sample data - replace with actual data fetching from Supabase when ready
  const sampleData = {
    recentOrders: [
      { date: '2023-10-07', pending: 5, inProgress: 3, completed: 7 },
      { date: '2023-10-08', pending: 6, inProgress: 4, completed: 5 },
      { date: '2023-10-09', pending: 4, inProgress: 5, completed: 6 },
      { date: '2023-10-10', pending: 7, inProgress: 3, completed: 4 },
      { date: '2023-10-11', pending: 5, inProgress: 6, completed: 5 },
      { date: '2023-10-12', pending: 3, inProgress: 7, completed: 8 },
      { date: '2023-10-13', pending: 6, inProgress: 5, completed: 6 }
    ],
    employeeProductivity: {
      'John Doe': 15,
      'Jane Smith': 12,
      'Mike Johnson': 18,
      'Emily Brown': 10,
      'Chris Lee': 14
    },
    dailyRevenue: {
      '2023-10-07': 25000,
      '2023-10-08': 27000,
      '2023-10-09': 22000,
      '2023-10-10': 30000,
      '2023-10-11': 28000,
      '2023-10-12': 32000,
      '2023-10-13': 29000
    }
  };

  function fetchDashboardData() {
    // TODO: Replace with actual Supabase queries when ready
    // For now, we'll use the sample data

    // Update total orders, pending payments, upcoming orders, and daily revenue
    totalOrders = sampleData.recentOrders.reduce((sum, day) => sum + day.pending + day.inProgress + day.completed, 0);
    pendingPayments = 150000; // Sample value
    upcomingOrders = 25; // Sample value
    dailyRevenue = sampleData.dailyRevenue[Object.keys(sampleData.dailyRevenue).pop()]; // Latest day's revenue

    updateRecentOrdersChart(sampleData.recentOrders);
    updateEmployeeProductivityChart(sampleData.employeeProductivity);
    updateDailyRevenueChart(sampleData.dailyRevenue);
  }

  function updateRecentOrdersChart(data) {
    const ctx = document.getElementById('recentOrdersChart').getContext('2d');
    recentOrdersChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(d => d.date),
        datasets: [
          {
            label: 'Pending',
            data: data.map(d => d.pending),
            backgroundColor: '#FF6B35',
          },
          {
            label: 'In Progress',
            data: data.map(d => d.inProgress),
            backgroundColor: '#E85D2F',
          },
          {
            label: 'Completed',
            data: data.map(d => d.completed),
            backgroundColor: '#FFB599',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true, stacked: true }, x: { stacked: true } },
      },
    });
  }

  function updateEmployeeProductivityChart(data) {
    const ctx = document.getElementById('employeeProductivityChart').getContext('2d');
    employeeProductivityChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(data),
        datasets: [{
          label: 'Completed Orders',
          data: Object.values(data),
          backgroundColor: '#FF6B35',
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true } },
      },
    });
  }

  function updateDailyRevenueChart(data) {
    const ctx = document.getElementById('dailyRevenueChart').getContext('2d');
    dailyRevenueChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: Object.keys(data),
        datasets: [{
          label: 'Daily Revenue',
          data: Object.values(data),
          borderColor: '#FF6B35',
          backgroundColor: 'rgba(255, 107, 53, 0.2)',
          fill: true,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true } },
      },
    });
  }

  onMount(() => {
    fetchDashboardData();
  });
</script>

<div class="p-6 bg-white rounded-lg shadow-md">
  <h1 class="text-3xl font-bold mb-6">Dashboard Overview</h1>

  <!-- Stats Cards -->
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
    <div class="bg-white p-4 rounded-lg shadow">
      <h3 class="text-lg font-semibold text-gray-600">Total Orders</h3>
      <p class="text-2xl font-bold">{totalOrders}</p>
    </div>
    <div class="bg-white p-4 rounded-lg shadow">
      <h3 class="text-lg font-semibold text-gray-600">Pending Payments</h3>
      <p class="text-2xl font-bold">₱{pendingPayments.toLocaleString()}</p>
    </div>
    <div class="bg-white p-4 rounded-lg shadow">
      <h3 class="text-lg font-semibold text-gray-600">Upcoming Orders (7 days)</h3>
      <p class="text-2xl font-bold">{upcomingOrders}</p>
    </div>
    <div class="bg-white p-4 rounded-lg shadow">
      <h3 class="text-lg font-semibold text-gray-600">Daily Revenue</h3>
      <p class="text-2xl font-bold">₱{dailyRevenue.toLocaleString()}</p>
    </div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Recent Orders Chart -->
    <div class="bg-white p-4 rounded-lg shadow">
      <h2 class="text-xl font-semibold mb-4">Recent Orders (Last 7 Days)</h2>
      <div class="h-72">
        <canvas id="recentOrdersChart"></canvas>
      </div>
    </div>

    <!-- Employee Productivity Chart -->
    <div class="bg-white p-4 rounded-lg shadow">
      <h2 class="text-xl font-semibold mb-4">Employee Productivity</h2>
      <div class="h-72">
        <canvas id="employeeProductivityChart"></canvas>
      </div>
    </div>

    <!-- Daily Revenue Summary Chart -->
    <div class="bg-white p-4 rounded-lg shadow lg:col-span-2">
      <h2 class="text-xl font-semibold mb-4">Daily Revenue Summary</h2>
      <div class="h-72">
        <canvas id="dailyRevenueChart"></canvas>
      </div>
    </div>
  </div>

  <!-- Quick Action Buttons -->
  <div class="flex flex-wrap gap-4 mt-6">
    <button class="bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded">Create New Order</button>
    <button class="bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded">Assign Orders</button>
    <button class="bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded">Process Payment</button>
    <button class="bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded">Generate Reports</button>
  </div>
</div>

<style>
  /* Custom Styling */
  h2 {
    color: #FF6B35;
  }
  .bg-primary {
    background-color: #FF6B35;
  }
  .hover\:bg-primary-dark:hover {
    background-color: #E85D2F;
  }
</style>