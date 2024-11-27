<script>
  import { Chart, registerables } from "chart.js";
  import { onMount, onDestroy } from "svelte";

  Chart.register(...registerables);
  export let data;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(value);
  };

  const formatPercent = (value) => `${Number(value).toFixed(1)}%`;

  // Updated metrics without emojis
  const metrics = [
    {
      title: "Total Students",
      value: data.basicStats.totalStudents,
      color: "from-blue-500 to-blue-600",
    },
    {
      title: "Total Orders",
      value: data.basicStats.totalOrders,
      color: "from-primary to-primary-dark",
    },
    {
      title: "Completion Rate",
      value: formatPercent(data.basicStats.completionRate),
      color: "from-green-500 to-green-600",
    },
    {
      title: "Total Revenue",
      value: formatCurrency(data.basicStats.totalRevenue),
      color: "from-purple-500 to-purple-600",
    },
  ];

  // Improved common chart options
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: { usePointStyle: true, padding: 15, font: { size: 12 } },
      },
      tooltip: {
        backgroundColor: "#1f2937",
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "#e5e7eb",
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 12 }, color: "#6b7280" },
      },
      y: {
        grid: { color: "#e5e7eb" },
        ticks: { font: { size: 12 }, color: "#6b7280" },
        beginAtZero: true,
      },
    },
  };

  let selectedTimeFrame = "day";
  const timeFrames = ["day", "week", "month", "year"];

  // Add chart instance variables
  let revenueChart;
  let averageOrderValueChart;
  let orderStatusChart;
  let courseEnrollmentChart;
  let genderChart;
  let busyDaysChart;
  let employeePerformanceChart;
  let quarterlyRevenueChart;
  let paymentStatusChart;
  let completionPerformanceChart;

  // Add corresponding element references
  let revenueChartEl;
  let averageOrderValueChartEl;
  let orderStatusChartEl;
  let courseEnrollmentChartEl;
  let genderChartEl;
  let busyDaysChartEl;
  let employeePerformanceChartEl;
  let quarterlyRevenueChartEl;
  let paymentStatusChartEl;
  let completionPerformanceChartEl;

  // Function to initialize revenue chart
  function initRevenueChart() {
    if (revenueChart) revenueChart.destroy();
    if (!revenueChartEl) return;

    const labels = Object.keys(
      data.financialMetrics.revenueOverTime[selectedTimeFrame]
    ).sort();
    revenueChart = new Chart(revenueChartEl, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: `Revenue (${selectedTimeFrame})`,
            data: labels.map(
              (key) =>
                data.financialMetrics.revenueOverTime[selectedTimeFrame][key]
            ),
            borderColor: "#B73233",
            backgroundColor: "rgba(183, 50, 51, 0.1)",
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        ...commonOptions,
        scales: {
          y: {
            beginAtZero: true,
            ticks: { callback: (value) => formatCurrency(value) },
          },
        },
      },
    });
  }

  // Function to initialize average order value chart
  function initAverageOrderValueChart() {
    if (averageOrderValueChart) averageOrderValueChart.destroy();
    if (!averageOrderValueChartEl) return;

    const labels = Object.keys(
      data.additionalMetrics.averageOrderValueOverTime[selectedTimeFrame]
    );
    
    const values = labels.map(key => {
        const item = data.additionalMetrics.averageOrderValueOverTime[selectedTimeFrame][key];
        return item.count > 0 ? (item.total / item.count).toFixed(2) : 0;
    });

    averageOrderValueChart = new Chart(averageOrderValueChartEl, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: `Average Order Value (${selectedTimeFrame})`,
                data: values,
                borderColor: '#E85D2F',
                backgroundColor: 'rgba(232, 93, 47, 0.1)',
                fill: true,
                tension: 0.4,
                spanGaps: true // This ensures continuous line even with missing data
            }]
        },
        options: {
            ...commonOptions,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: (value) => formatCurrency(value) }
                }
            }
        }
    });
}

// Initialize order status chart
  function initOrderStatusChart() {
    if (orderStatusChart) orderStatusChart.destroy();
    if (!orderStatusChartEl) return;

    orderStatusChart = new Chart(orderStatusChartEl, {
      type: "doughnut",
      data: {
        labels: Object.keys(data.orderMetrics.byStatus),
        datasets: [
          {
            data: Object.values(data.orderMetrics.byStatus),
            backgroundColor: ["#10B981", "#3B82F6", "#F59E0B", "#EF4444"],
          },
        ],
      },
      options: {
        ...commonOptions,
        cutout: "60%",
      },
    });
  }

  // Initialize course enrollment chart
  function initCourseEnrollmentChart() {
    if (courseEnrollmentChart) courseEnrollmentChart.destroy();
    if (!courseEnrollmentChartEl) return;

    courseEnrollmentChart = new Chart(courseEnrollmentChartEl, {
      type: "bar",
      data: {
        labels: Object.keys(data.studentAnalytics.courseEnrollment),
        datasets: [
          {
            label: "Students Enrolled",
            data: Object.values(data.studentAnalytics.courseEnrollment),
            backgroundColor: "#B73233",
          },
        ],
      },
      options: commonOptions,
    });
  }

  // Initialize gender distribution chart
  function initGenderChart() {
    if (genderChart) genderChart.destroy();
    if (!genderChartEl) return;

    genderChart = new Chart(genderChartEl, {
      type: "pie",
      data: {
        labels: Object.keys(data.studentAnalytics.genderDistribution),
        datasets: [
          {
            data: Object.values(data.studentAnalytics.genderDistribution),
            backgroundColor: ["#EC4899", "#3B82F6"],
          },
        ],
      },
      options: commonOptions,
    });
  }

  // Initialize busy days chart
  function initBusyDaysChart() {
    if (busyDaysChart) busyDaysChart.destroy();
    if (!busyDaysChartEl) return;

    busyDaysChart = new Chart(busyDaysChartEl, {
      type: "bar",
      data: {
        labels: Object.keys(data.timeBasedMetrics.busyDays),
        datasets: [
          {
            label: "Orders",
            data: Object.values(data.timeBasedMetrics.busyDays),
            backgroundColor: "#E85D2F",
          },
        ],
      },
      options: commonOptions,
    });
  }

  // Initialize employee performance chart
  function initEmployeePerformanceChart() {
    if (employeePerformanceChart) employeePerformanceChart.destroy();
    if (!employeePerformanceChartEl) return;

    const employeeData = data.performanceMetrics.employeeStats;
    employeePerformanceChart = new Chart(employeePerformanceChartEl, {
      type: "bar",
      data: {
        labels: Object.keys(employeeData),
        datasets: [
          {
            label: "Completed Orders",
            data: Object.values(employeeData).map((e) => e.completed),
            backgroundColor: "#10B981",
          },
        ],
      },
      options: commonOptions,
    });
  }

  // Initialize quarterly revenue chart
  function initQuarterlyRevenueChart() {
    if (quarterlyRevenueChart) quarterlyRevenueChart.destroy();
    if (!quarterlyRevenueChartEl) return;

    quarterlyRevenueChart = new Chart(quarterlyRevenueChartEl, {
      type: "bar",
      data: {
        labels: Object.keys(data.financialMetrics.revenueByQuarter),
        datasets: [
          {
            label: "Revenue",
            data: Object.values(data.financialMetrics.revenueByQuarter),
            backgroundColor: "#B73233",
          },
        ],
      },
      options: {
        ...commonOptions,
        scales: {
          y: {
            beginAtZero: true,
            ticks: { callback: (value) => formatCurrency(value) },
          },
        },
      },
    });
  }

  // Initialize payment status chart
  function initPaymentStatusChart() {
    if (paymentStatusChart) paymentStatusChart.destroy();
    if (!paymentStatusChartEl) return;

    paymentStatusChart = new Chart(paymentStatusChartEl, {
      type: "doughnut",
      data: {
        labels: Object.keys(data.financialMetrics.paymentStats),
        datasets: [
          {
            data: Object.values(data.financialMetrics.paymentStats),
            backgroundColor: ["#10B981", "#F59E0B", "#EF4444"],
          },
        ],
      },
      options: {
        ...commonOptions,
        cutout: "60%",
      },
    });
  }

  // Initialize completion performance chart
  function initCompletionPerformanceChart() {
    if (completionPerformanceChart) completionPerformanceChart.destroy();
    if (!completionPerformanceChartEl) return;

    const performanceData = data.timeBasedMetrics.deliveryPerformance;
    completionPerformanceChart = new Chart(completionPerformanceChartEl, {
      type: "doughnut",
      data: {
        labels: ["On Time", "Late"],
        datasets: [
          {
            data: [performanceData.onTime, performanceData.late],
            backgroundColor: ["#10B981", "#EF4444"],
          },
        ],
      },
      options: {
        ...commonOptions,
        cutout: "60%",
      },
    });
  }

  // Update charts function
  function updateCharts() {
    initRevenueChart();
    initAverageOrderValueChart();
    initOrderStatusChart();
    initCourseEnrollmentChart();
    initGenderChart();
    initBusyDaysChart();
    initEmployeePerformanceChart();
    initQuarterlyRevenueChart();
    initPaymentStatusChart();
    initCompletionPerformanceChart();
  }

  onMount(() => {
    updateCharts();
  });

  onDestroy(() => {
    // Cleanup charts
    if (revenueChart) revenueChart.destroy();
    if (averageOrderValueChart) averageOrderValueChart.destroy();
    if (orderStatusChart) orderStatusChart.destroy();
    if (courseEnrollmentChart) courseEnrollmentChart.destroy();
    if (genderChart) genderChart.destroy();
    if (busyDaysChart) busyDaysChart.destroy();
    if (employeePerformanceChart) employeePerformanceChart.destroy();
    if (quarterlyRevenueChart) quarterlyRevenueChart.destroy();
    if (paymentStatusChart) paymentStatusChart.destroy();
    if (completionPerformanceChart) completionPerformanceChart.destroy();
  });

  $: if (selectedTimeFrame) {
    updateCharts(); // Update charts when time frame changes
  }
</script>

<div
  class="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200"
>
  <div class="p-6 space-y-8">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <h1
        class="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-dark"
      >
        Dashboard Overview
      </h1>
      <div class="text-sm text-gray-500">
        Last updated: {new Date().toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })}
      </div>
    </div>

    <!-- Key Metrics Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
      {#each metrics as metric}
        <div class="group relative">
          <div
            class="absolute inset-0 bg-gradient-to-r {metric.color} rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity"
          ></div>
          <div
            class="relative bg-white p-6 rounded-2xl shadow transition-transform transform hover:scale-105 border border-gray-200"
          >
            <h3 class="text-gray-600 font-medium">{metric.title}</h3>
            <p
              class="text-2xl font-bold mt-2 bg-clip-text text-transparent bg-gradient-to-r {metric.color}"
            >
              {metric.value}
            </p>
          </div>
        </div>
      {/each}
      {#each [{ title: "Overdue Orders", value: data.timeBasedMetrics.overdueOrders, color: "from-red-500 to-red-600" }, { title: "Due This Week", value: data.timeBasedMetrics.upcomingDue, color: "from-yellow-500 to-yellow-600" }, { title: "Avg Completion", value: `${data.timeBasedMetrics.averageCompletionTime} days`, color: "from-blue-500 to-blue-600" }, { title: "Rush Orders", value: data.timeBasedMetrics.rushOrders, color: "from-orange-500 to-orange-600" }] as metric}
        <div class="group relative">
          <div
            class="absolute inset-0 bg-gradient-to-r {metric.color} rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity"
          ></div>
          <div
            class="relative bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-white"
          >
            <h3 class="text-gray-600 font-medium">{metric.title}</h3>
            <p
              class="text-2xl font-bold mt-2 bg-clip-text text-transparent bg-gradient-to-r {metric.color}"
            >
              {metric.value}
            </p>
          </div>
        </div>
      {/each}
    </div>

    <!-- Recent Orders Table -->
    <div class="bg-white/90 p-6 rounded-2xl shadow-lg border">
      <h3 class="text-lg font-bold mb-4">Recent Orders</h3>
      <div class="overflow-auto max-h-72">
        <table class="min-w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-2 text-left text-xs font-medium text-gray-500"
                >Student</th
              >
              <th class="px-4 py-2 text-left text-xs font-medium text-gray-500"
                >Ordered At</th
              >
              <th class="px-4 py-2 text-left text-xs font-medium text-gray-500"
                >Due Date</th
              >
              <th class="px-4 py-2 text-left text-xs font-medium text-gray-500"
                >Status</th
              >
              <th class="px-4 py-2 text-left text-xs font-medium text-gray-500"
                >Amount</th
              >
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            {#each data.orderMetrics.recentOrders as order}
              <tr>
                <td class="px-4 py-2 text-sm">{order.student}</td>
                <td class="px-4 py-2 text-sm"
                  >{new Date(order.orderedAt).toLocaleDateString()}</td
                >
                <td class="px-4 py-2 text-sm"
                  >{new Date(order.dueDate).toLocaleDateString()}</td
                >
                <td class="px-4 py-2 text-sm">
                  <span
                    class="px-2 py-1 rounded-full text-xs
                                    {order.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : order.status === 'in progress'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'}"
                  >
                    {order.status}
                  </span>
                </td>
                <td class="px-4 py-2 text-sm">{formatCurrency(order.amount)}</td
                >
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Time-based Charts Section -->
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <h2 class="text-2xl font-bold text-gray-800">Time-Based Analytics</h2>
        <select
          bind:value={selectedTimeFrame}
          class="px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary"
        >
          {#each timeFrames as frame}
            <option value={frame}>
              {frame.charAt(0).toUpperCase() + frame.slice(1)}
            </option>
          {/each}
        </select>
      </div>

      <div class="grid grid-cols-12 gap-6">
        <!-- Time-dependent charts -->
        <div
          class="col-span-12 lg:col-span-6 bg-white/90 p-6 rounded-2xl shadow-lg border"
        >
          <h3 class="text-xl font-bold mb-6">Revenue Trend</h3>
          <div class="h-80">
            <canvas bind:this={revenueChartEl}></canvas>
          </div>
        </div>

        <div
          class="col-span-12 lg:col-span-6 bg-white/90 p-6 rounded-2xl shadow-lg border"
        >
          <h3 class="text-xl font-bold mb-6">Average Order Value</h3>
          <div class="h-80">
            <canvas
              bind:this={averageOrderValueChartEl}
              id="averageOrderValueChart"
            ></canvas>
          </div>
        </div>
      </div>
    </div>

    <!-- Static Analytics Section -->
    <div class="space-y-6">
      <h2 class="text-2xl font-bold text-gray-800">Current Status Overview</h2>

      <!-- Order & Payment Stats -->
      <div class="grid grid-cols-12 gap-6">
        <div
          class="col-span-12 md:col-span-6 lg:col-span-4 bg-white/90 p-6 rounded-2xl shadow-lg border"
        >
          <h3 class="text-lg font-bold mb-4">Order Status</h3>
          <div class="h-72">
            <canvas bind:this={orderStatusChartEl}></canvas>
          </div>
        </div>

        <div
          class="col-span-12 md:col-span-6 lg:col-span-4 bg-white/90 p-6 rounded-2xl shadow-lg border"
        >
          <h3 class="text-lg font-bold mb-4">Payment Status</h3>
          <div class="h-72">
            <canvas bind:this={paymentStatusChartEl}></canvas>
          </div>
        </div>

        <div
          class="col-span-12 md:col-span-6 lg:col-span-4 bg-white/90 p-6 rounded-2xl shadow-lg border"
        >
          <h3 class="text-lg font-bold mb-4">Completion Rate</h3>
          <div class="h-72">
            <canvas bind:this={completionPerformanceChartEl}></canvas>
          </div>
        </div>
      </div>

      <!-- Student Analytics -->
      <div class="grid grid-cols-12 gap-6">
        <div
          class="col-span-12 lg:col-span-8 bg-white/90 p-6 rounded-2xl shadow-lg border"
        >
          <h3 class="text-lg font-bold mb-4">Course Enrollment</h3>
          <div class="h-80">
            <canvas bind:this={courseEnrollmentChartEl}></canvas>
          </div>
        </div>

        <div
          class="col-span-12 lg:col-span-4 bg-white/90 p-6 rounded-2xl shadow-lg border"
        >
          <h3 class="text-lg font-bold mb-4">Gender Distribution</h3>
          <div class="h-80">
            <canvas bind:this={genderChartEl}></canvas>
          </div>
        </div>
      </div>

      <!-- Performance Metrics -->
      <div class="grid grid-cols-12 gap-6">
        <div
          class="col-span-12 md:col-span-6 bg-white/90 p-6 rounded-2xl shadow-lg border"
        >
          <h3 class="text-lg font-bold mb-4">Weekly Distribution</h3>
          <div class="h-72">
            <canvas bind:this={busyDaysChartEl}></canvas>
          </div>
        </div>

        <div
          class="col-span-12 md:col-span-6 bg-white/90 p-6 rounded-2xl shadow-lg border"
        >
          <h3 class="text-lg font-bold mb-4">Tailor
             Performance</h3>
          <div class="h-72">
            <canvas bind:this={employeePerformanceChartEl}></canvas>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  :global(.chart-container) {
    position: relative;
  }

  /* Add smooth scrolling to the page */
  :global(html) {
    scroll-behavior: smooth;
  }

  /* Add subtle animation to charts on hover */
  canvas {
    transition: transform 0.3s ease;
  }
  canvas:hover {
    transform: scale(1.02);
  }

  /* Updated styles for a modern look */
  .shadow {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  .hover\:scale-105:hover {
    transform: scale(1.05);
  }
  .hover\:shadow-lg:hover {
    box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
  }
</style>
