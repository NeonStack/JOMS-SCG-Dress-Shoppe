<script>
  import { onMount } from "svelte";
  import Chart from "chart.js/auto";
  import { supabase } from "$lib/supabaseClient";

  // Core state variables based on existing database
  let totalOrders = 0;
  let ordersByStatus = {
    PENDING: 0,
    IN_PROGRESS: 0,
    COMPLETED: 0
  };
  let totalRevenue = 0;
  let revenueByTime = [];
  let ordersByTime = [];
  let revenueByProgram = [];
  let employeePerformance = [];
  let recentOrders = [];
  let averageOrderValue = 0;

  // Charts
  let ordersChart;
  let revenueChart;
  let programRevenueChart;
  let performanceChart;

  // Filters
  let selectedTimeRange = "30d";
  let selectedView = "overview";

  const timeRanges = {
    "1d": { label: "Today", days: 1 },
    "7d": { label: "Last 7 days", days: 7 },
    "30d": { label: "Last 30 days", days: 30 }
  };

  async function fetchOrdersData(startDate) {
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        students (
          first_name,
          last_name,
          course_id,
          courses (name)
        ),
        profiles (first_name, last_name)
      `)
      .gte('created_at', startDate.toISOString());

    if (error) {
      console.error('Error fetching orders:', error);
      return;
    }

    // Calculate core metrics
    totalOrders = orders.length;
    totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
    averageOrderValue = totalOrders ? totalRevenue / totalOrders : 0;

    // Calculate orders by status
    ordersByStatus = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {PENDING: 0, IN_PROGRESS: 0, COMPLETED: 0});

    // Group orders by date
    const ordersByDate = orders.reduce((acc, order) => {
      const date = new Date(order.created_at).toLocaleDateString();
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    ordersByTime = Object.entries(ordersByDate).map(([date, count]) => ({
      date,
      count
    }));

    // Calculate revenue by program
    const programRevenue = orders.reduce((acc, order) => {
      const courseName = order.students?.courses?.name || 'Unknown';
      acc[courseName] = (acc[courseName] || 0) + (order.total_amount || 0);
      return acc;
    }, {});

    revenueByProgram = Object.entries(programRevenue).map(([name, amount]) => ({
      name,
      amount
    }));

    // Get employee performance
    const employeeStats = orders.reduce((acc, order) => {
      const employeeName = order.profiles ? 
        `${order.profiles.first_name} ${order.profiles.last_name}` : 
        'Unassigned';
      
      if (!acc[employeeName]) {
        acc[employeeName] = { total: 0, completed: 0 };
      }
      acc[employeeName].total++;
      if (order.status === 'COMPLETED') {
        acc[employeeName].completed++;
      }
      return acc;
    }, {});

    employeePerformance = Object.entries(employeeStats).map(([name, stats]) => ({
      name,
      performance: stats.total ? (stats.completed / stats.total) * 100 : 0
    }));

    // Get recent orders
    recentOrders = orders
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5)
      .map(order => ({
        id: order.id,
        student_name: `${order.students?.first_name} ${order.students?.last_name}`,
        amount: order.total_amount,
        status: order.status
      }));
  }

  function updateCharts() {
    // Orders Chart
    const ordersCtx = document.getElementById("ordersChart")?.getContext("2d");
    if (ordersCtx) {
      ordersChart?.destroy();
      ordersChart = new Chart(ordersCtx, {
        type: "line",
        data: {
          labels: ordersByTime.map(order => order.date),
          datasets: [{
            label: "Orders",
            data: ordersByTime.map(order => order.count),
            borderColor: "#4A90E2",
            fill: false
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: { display: true, text: "Orders Over Time" }
          }
        }
      });
    }

    // Program Revenue Chart
    const programRevenueCtx = document.getElementById("programRevenueChart")?.getContext("2d");
    if (programRevenueCtx) {
      programRevenueChart?.destroy();
      programRevenueChart = new Chart(programRevenueCtx, {
        type: "bar",
        data: {
          labels: revenueByProgram.map(program => program.name),
          datasets: [{
            label: "Revenue",
            data: revenueByProgram.map(program => program.amount),
            backgroundColor: "#4A90E2"
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: { display: true, text: "Revenue by Program" }
          }
        }
      });
    }

    // Employee Performance Chart
    const performanceCtx = document.getElementById("performanceChart")?.getContext("2d");
    if (performanceCtx) {
      performanceChart?.destroy();
      performanceChart = new Chart(performanceCtx, {
        type: "bar",
        data: {
          labels: employeePerformance.map(emp => emp.name),
          datasets: [{
            label: "Completion Rate (%)",
            data: employeePerformance.map(emp => emp.performance.toFixed(1)),
            backgroundColor: "#4A90E2"
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: { display: true, text: "Employee Performance" }
          }
        }
      });
    }
  }

  async function fetchDashboardData(range = "7d") {
    const { days } = timeRanges[range];
    const now = new Date();
    const startDate = new Date(now.setDate(now.getDate() - days));
    await fetchOrdersData(startDate);
    updateCharts();
  }

  onMount(() => {
    fetchDashboardData();
  });

  function handleTimeRangeChange(value) {
    selectedTimeRange = value;
    fetchDashboardData(value);
  }
</script>

<div class="dashboard-container">
  <div class="dashboard-content">
    <!-- Header -->
    <div class="dashboard-header">
      <div class="header-content">
        <div>
          <h1 class="dashboard-title">Uniform Management Dashboard</h1>
          <p class="dashboard-subtitle">Overview of orders and analytics</p>
        </div>

        <!-- Time Range Filter -->
        <div class="time-filters">
          {#each Object.entries(timeRanges) as [value, { label }]}
            <button
              class="time-filter-btn"
              class:active={selectedTimeRange === value}
              on:click={() => handleTimeRangeChange(value)}
            >
              {label}
            </button>
          {/each}
        </div>
      </div>
    </div>

    <!-- Key Metrics -->
    <div class="metrics-grid">
      <!-- Total Orders -->
      <div class="metric-card orders">
        <div class="metric-content">
          <div>
            <p class="metric-label">Total Orders</p>
            <h3 class="metric-value">{totalOrders}</h3>
          </div>
        </div>
      </div>

      <!-- Revenue -->
      <div class="metric-card revenue">
        <div class="metric-content">
          <div>
            <p class="metric-label">Total Revenue</p>
            <h3 class="metric-value">₱{totalRevenue.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      <!-- Average Order Value -->
      <div class="metric-card avg-order">
        <div class="metric-content">
          <div>
            <p class="metric-label">Average Order Value</p>
            <h3 class="metric-value">₱{averageOrderValue.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      <!-- Order Status -->
      <div class="metric-card status">
        <div class="metric-content">
          <div>
            <p class="metric-label">Order Status</p>
            <div class="status-counts">
              <span>Pending: {ordersByStatus.PENDING}</span>
              <span>In Progress: {ordersByStatus.IN_PROGRESS}</span>
              <span>Completed: {ordersByStatus.COMPLETED}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Charts Grid -->
    <div class="charts-grid">
      <!-- Orders Timeline -->
      <div class="chart-card">
        <h3 class="chart-title">Orders Timeline</h3>
        <canvas id="ordersChart"></canvas>
      </div>

      <!-- Revenue Distribution -->
      <div class="chart-card">
        <h3 class="chart-title">Revenue by Program</h3>
        <canvas id="programRevenueChart"></canvas>
      </div>

      <!-- Employee Performance -->
      <div class="chart-card">
        <h3 class="chart-title">Employee Performance</h3>
        <canvas id="performanceChart"></canvas>
      </div>

      <!-- Recent Orders -->
      <div class="chart-card">
        <h3 class="chart-title">Recent Orders</h3>
        <div class="table-container">
          <table class="orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Student</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {#each recentOrders as order}
                <tr>
                  <td>#{order.id}</td>
                  <td>{order.student_name}</td>
                  <td>₱{order.amount.toLocaleString()}</td>
                  <td>
                    <span class="status-badge {order.status.toLowerCase()}">
                      {order.status}
                    </span>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .dashboard-container {
    @apply min-h-screen bg-gray-50 p-6;
  }

  .dashboard-content {
    @apply max-w-7xl mx-auto space-y-6;
  }

  .dashboard-header {
    @apply bg-white p-6 rounded-xl shadow-sm;
  }

  .header-content {
    @apply flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4;
  }

  .dashboard-title {
    @apply text-2xl font-bold text-gray-900;
  }

  .dashboard-subtitle {
    @apply text-gray-500 mt-1;
  }

  .time-filters {
    @apply flex flex-wrap gap-2;
  }

  .time-filter-btn {
    @apply px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ease-in-out bg-gray-100 text-gray-600 hover:bg-blue-500 hover:text-white;
  }

  .time-filter-btn.active {
    @apply bg-blue-500 text-white shadow-md;
  }

  .metrics-grid {
    @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6;
  }

  .metric-card {
    @apply bg-white p-6 rounded-xl shadow-sm border-l-4 hover:shadow-md transition-shadow;
  }

  .metric-card.orders { @apply border-blue-500; }
  .metric-card.revenue { @apply border-green-500; }
  .metric-card.avg-order { @apply border-purple-500; }
  .metric-card.status { @apply border-yellow-500; }

  .metric-content {
    @apply flex items-center justify-between;
  }

  .metric-label {
    @apply text-gray-500 text-sm font-medium;
  }

  .metric-value {
    @apply text-3xl font-bold text-gray-900;
  }

  .status-counts {
    @apply flex flex-col gap-1 text-sm;
  }

  .charts-grid {
    @apply grid grid-cols-1 lg:grid-cols-2 gap-6;
  }

  .chart-card {
    @apply bg-white p-6 rounded-xl shadow-sm;
  }

  .chart-title {
    @apply text-lg font-semibold mb-4;
  }

  .table-container {
    @apply overflow-x-auto;
  }

  .orders-table {
    @apply min-w-full divide-y divide-gray-200;
  }

  .orders-table th {
    @apply px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider;
  }

  .orders-table td {
    @apply px-6 py-4 whitespace-nowrap text-sm text-gray-900;
  }

  .status-badge {
    @apply px-2 py-1 text-xs font-medium rounded-full;
  }

  .status-badge.pending {
    @apply bg-yellow-100 text-yellow-800;
  }

  .status-badge.in_progress {
    @apply bg-blue-100 text-blue-800;
  }

  .status-badge.completed {
    @apply bg-green-100 text-green-800;
  }
</style>