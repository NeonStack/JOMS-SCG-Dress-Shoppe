<script>
  import { get } from "svelte/store";

  export let data;
  let dateRange = { start: "", end: "" };
  let selectedEmployee = "all";
  let metrics = {};
  let selectedStatus = "all";
  let searchQuery = "";

  // Add sorting state
  let sortState = {
    column: "created_at",
    direction: "desc",
  };

  // Sorting function
  const toggleSort = (column) => {
    if (sortState.column === column) {
      sortState.direction = sortState.direction === "asc" ? "desc" : "asc";
    } else {
      sortState = {
        column: column,
        direction: "asc",
      };
    }
  };

  // Updated sort icons to match course page
  function getSortIcon(column) {
    if (sortState.column !== column) return "";
    return sortState.direction === "asc" ? "↑" : "↓";
  }

  // Sort orders
  $: sortedOrders = data.performanceData
    ?.filter(
      (order) =>
        selectedEmployee === "all" || order.employee_id === selectedEmployee
    )
    ?.sort((a, b) => {
      const modifier = sortState.direction === "asc" ? 1 : -1;
      switch (sortState.column) {
        case "created_at":
          return modifier * (new Date(a.created_at) - new Date(b.created_at));
        case "due_date":
          return modifier * (new Date(a.due_date) - new Date(b.due_date));
        case "student":
          return (
            modifier *
            (a.student?.last_name || "").localeCompare(
              b.student?.last_name || ""
            )
          );
        case "status":
          return modifier * a.status.localeCompare(b.status);
        case "employee":
          return (
            modifier *
            (a.employee?.last_name || "").localeCompare(
              b.employee?.last_name || ""
            )
          );
        default:
          return 0;
      }
    });

  $: calculateMetrics(
    data.performanceData,
    orderDateRange,
    dueDateRange,
    selectedEmployee
  );

  // Replace the single dateRange with separate ranges
  let orderDateRange = { start: "", end: "" };
  let dueDateRange = { start: "", end: "" };

  // Date validation function
  function validateDateRanges() {
    // Set min/max for order date range
    if (orderDateRange.start) {
      const startInput = document.getElementById("order-date-end");
      if (startInput) startInput.min = orderDateRange.start;
    }
    if (orderDateRange.end) {
      const endInput = document.getElementById("order-date-start");
      if (endInput) endInput.max = orderDateRange.end;
    }

    // Set min/max for due date range
    if (dueDateRange.start) {
      const startInput = document.getElementById("due-date-end");
      if (startInput) startInput.min = dueDateRange.start;
    }
    if (dueDateRange.end) {
      const endInput = document.getElementById("due-date-start");
      if (endInput) endInput.max = dueDateRange.end;
    }
  }

  // Add new functions for advanced metrics
  function calculateWorkloadDistribution(orders) {
    const dayOfWeek = orders.reduce((acc, order) => {
      const day = new Date(order.created_at).getDay();
      const dayName = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ][day];
      acc[dayName] = (acc[dayName] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(dayOfWeek)
      .sort((a, b) => b[1] - a[1])
      .reduce((acc, [day, count]) => {
        acc[day] = count;
        return acc;
      }, {});
  }

  function calculateEmployeeComparison(orders, employees) {
    return employees
      .map((employee) => {
        const employeeOrders = orders.filter(
          (o) => o.employee_id === employee.id
        );
        const completed = employeeOrders.filter(
          (o) => o.status === "completed"
        );

        return {
          id: employee.id,
          name: `${employee.first_name} ${employee.last_name}`,
          metrics: {
            totalOrders: employeeOrders.length,
            completionRate: completed.length
              ? ((completed.length / employeeOrders.length) * 100).toFixed(1)
              : 0,
            avgCompletionTime: calculateAverageCompletionTime(employeeOrders),
            onTimeDeliveryRate: calculateEfficiencyRate(employeeOrders),
          },
        };
      })
      .sort(
        (a, b) =>
          parseFloat(b.metrics.onTimeDeliveryRate) -
          parseFloat(a.metrics.onTimeDeliveryRate)
      );
  }

  function predictCompletionTime(order, historicalData) {
    // Only use completed orders
    const completedOrders = historicalData.filter(o => o.status === 'completed');
    
    if (order.status === 'pending') {
        // For pending orders, use general average for this uniform type
        const typeHistory = completedOrders.filter(
            o => o.uniform_type === order.uniform_type
        );

        if (typeHistory.length > 0) {
            const avgTime = typeHistory.reduce((acc, o) => {
                const days = (new Date(o.updated_at) - new Date(o.created_at)) / (1000 * 60 * 60 * 24);
                return acc + days;
            }, 0) / typeHistory.length;

            return {
                days: avgTime.toFixed(1),
                source: 'general'
            };
        }
    }

    if (order.status === 'in progress' && order.employee_id) {
        // For in-progress orders, look at specific employee's history with this uniform type
        const employeeHistory = completedOrders.filter(
            o => o.employee_id === order.employee_id && 
                 o.uniform_type === order.uniform_type
        );

        if (employeeHistory.length > 0) {
            const avgTime = employeeHistory.reduce((acc, o) => {
                const days = (new Date(o.updated_at) - new Date(o.created_at)) / (1000 * 60 * 60 * 24);
                return acc + days;
            }, 0) / employeeHistory.length;

            return {
                days: avgTime.toFixed(1),
                source: 'employee'
            };
        }
    }

    return null;
  }

  // Update calculateMetrics to use both date ranges
  function calculateMetrics(orders, orderDateRange, dueDateRange, employeeId) {
    if (!orders) return;

    const filteredOrders = orders.filter((order) => {
      const orderDate = new Date(order.created_at).setHours(0, 0, 0, 0);
      const dueDate = new Date(order.due_date).setHours(0, 0, 0, 0);

      const inOrderDateRange =
        (!orderDateRange.start ||
          orderDate >= new Date(orderDateRange.start).setHours(0, 0, 0, 0)) &&
        (!orderDateRange.end ||
          orderDate <= new Date(orderDateRange.end).setHours(23, 59, 59, 999));

      const inDueDateRange =
        (!dueDateRange.start ||
          dueDate >= new Date(dueDateRange.start).setHours(0, 0, 0, 0)) &&
        (!dueDateRange.end ||
          dueDate <= new Date(dueDateRange.end).setHours(23, 59, 59, 999));

      const matchesEmployee =
        employeeId === "all" || order.employee_id === employeeId;
      return inOrderDateRange && inDueDateRange && matchesEmployee;
    });

    const now = new Date();

    metrics = {
      totalOrders: filteredOrders.length,
      completedOrders: filteredOrders.filter((o) => o.status === "completed")
        .length,
      pendingOrders: filteredOrders.filter((o) => o.status === "pending")
        .length,
      inProgressOrders: filteredOrders.filter((o) => o.status === "in progress")
        .length,
      lateOrders: filteredOrders.filter((o) => {
        if (o.status === "completed") {
          return new Date(o.updated_at) > new Date(o.due_date);
        } else if (o.status === "in progress" || o.status === "pending") {
          return now > new Date(o.due_date);
        }
        return false;
      }).length,
      averageCompletionTime: calculateAverageCompletionTime(filteredOrders),
      ordersByDay: calculateOrdersByDay(filteredOrders),
      efficiencyRate: calculateEfficiencyRate(filteredOrders),
      fastestCompletion: calculateFastestCompletion(filteredOrders),
      slowestCompletion: calculateSlowestCompletion(filteredOrders),
      averageTimePerUniform: calculateAverageTimeByUniformType(filteredOrders),
      workloadDistribution: calculateWorkloadDistribution(filteredOrders),
      employeeComparison: calculateEmployeeComparison(orders, data.employees),
      predictedCompletions: filteredOrders.reduce((acc, order) => {
        if (order.status !== "completed") {
          acc[order.id] = predictCompletionTime(order, orders);
        }
        return acc;
      }, {}),
    };
  }

  function calculateAverageCompletionTime(orders) {
    const completedOrders = orders.filter((o) => o.status === "completed");
    const totalDays = completedOrders.reduce((acc, order) => {
      const start = new Date(order.created_at);
      const end = new Date(order.updated_at);
      return acc + (end - start) / (1000 * 60 * 60 * 24);
    }, 0);
    return completedOrders.length
      ? (totalDays / completedOrders.length).toFixed(1)
      : 0;
  }

  function calculateOrdersByDay(orders) {
    return orders.reduce((acc, order) => {
      const date = new Date(order.created_at).toISOString().split("T")[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});
  }

  function calculateEfficiencyRate(orders) {
    const completed = orders.filter((o) => o.status === "completed");
    const onTime = completed.filter(
      (o) => new Date(o.updated_at) <= new Date(o.due_date)
    );
    return completed.length
      ? ((onTime.length / completed.length) * 100).toFixed(1)
      : 0;
  }

  function calculateFastestCompletion(orders) {
    const completed = orders.filter((o) => o.status === "completed");
    let fastest = Infinity;
    completed.forEach((order) => {
      const days =
        (new Date(order.updated_at) - new Date(order.created_at)) /
        (1000 * 60 * 60 * 24);
      if (days < fastest) fastest = days;
    });
    return fastest === Infinity ? 0 : fastest.toFixed(1);
  }

  function calculateSlowestCompletion(orders) {
    const completed = orders.filter((o) => o.status === "completed");
    let slowest = 0;
    completed.forEach((order) => {
      const days =
        (new Date(order.updated_at) - new Date(order.created_at)) /
        (1000 * 60 * 60 * 24);
      if (days > slowest) slowest = days;
    });
    return slowest.toFixed(1);
  }

  function calculateAverageTimeByUniformType(orders) {
    const completed = orders.filter((o) => o.status === "completed");
    const byType = completed.reduce((acc, order) => {
      const days =
        (new Date(order.updated_at) - new Date(order.created_at)) /
        (1000 * 60 * 60 * 24);
      if (!acc[order.uniform_type]) {
        acc[order.uniform_type] = { total: 0, count: 0 };
      }
      acc[order.uniform_type].total += days;
      acc[order.uniform_type].count++;
      return acc;
    }, {});

    return Object.entries(byType).reduce((acc, [type, data]) => {
      acc[type] = (data.total / data.count).toFixed(1);
      return acc;
    }, {});
  }

  // Improved date formatting
  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  // Update name formatting
  function formatName(first, last) {
    return `${first} ${last}`;
  }

  // Simplified work duration calculation
  function calculateWorkDuration(order) {
    const start = new Date(order.created_at);
    const end =
      order.status === "completed" ? new Date(order.updated_at) : new Date();
    const dueDate = new Date(order.due_date);
    const daysTaken = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const daysOverdue = Math.ceil((end - dueDate) / (1000 * 60 * 60 * 24));

    let status;
    if (order.status === "completed") {
      status =
        daysOverdue > 5
          ? "Completed (5+ days late)"
          : daysOverdue > 0
            ? "Completed (Late)"
            : "Completed (On Time)";
    } else {
      status = new Date() > dueDate ? "Overdue" : order.status;
    }

    return {
      days: daysTaken,
      daysOverdue: Math.max(0, daysOverdue),
      status,
    };
  }

  function clearFilters() {
    orderDateRange = { start: "", end: "" };
    dueDateRange = { start: "", end: "" };
    selectedEmployee = "all";
    selectedStatus = "all";
    searchQuery = "";

    // Reset min/max attributes for all date inputs
    [
      "order-date-start",
      "order-date-end",
      "due-date-start",
      "due-date-end",
    ].forEach((id) => {
      const input = document.getElementById(id);
      if (input) {
        input.min = "";
        input.max = "";
      }
    });
  }

  // Filter orders based on all criteria
  $: filteredOrders = sortedOrders?.filter((order) => {
    const orderDate = new Date(order.created_at).setHours(0, 0, 0, 0);
    const dueDate = new Date(order.due_date).setHours(0, 0, 0, 0);

    const inOrderDateRange =
      (!orderDateRange.start ||
        orderDate >= new Date(orderDateRange.start).setHours(0, 0, 0, 0)) &&
      (!orderDateRange.end ||
        orderDate <= new Date(orderDateRange.end).setHours(23, 59, 59, 999));

    const inDueDateRange =
      (!dueDateRange.start ||
        dueDate >= new Date(dueDateRange.start).setHours(0, 0, 0, 0)) &&
      (!dueDateRange.end ||
        dueDate <= new Date(dueDateRange.end).setHours(23, 59, 59, 999));

    const searchTerms = searchQuery.toLowerCase().trim();

    // Create full names for easier searching
    const studentFullName = order.student
      ? `${order.student.first_name} ${order.student.last_name}`.toLowerCase()
      : "";
    const employeeFullName = order.employee
      ? `${order.employee.first_name} ${order.employee.last_name}`.toLowerCase()
      : "";

    const matchesSearch =
      searchQuery === "" ||
      // Full name search
      studentFullName.includes(searchTerms) ||
      employeeFullName.includes(searchTerms) ||
      // Individual name parts search
      order.student?.first_name.toLowerCase().includes(searchTerms) ||
      order.student?.last_name.toLowerCase().includes(searchTerms) ||
      order.employee?.first_name.toLowerCase().includes(searchTerms) ||
      order.employee?.last_name.toLowerCase().includes(searchTerms) ||
      // Date searches
      formatDate(order.created_at).toLowerCase().includes(searchTerms) ||
      formatDate(order.due_date).toLowerCase().includes(searchTerms) ||
      // Status search
      order.status.toLowerCase().includes(searchTerms);

    const matchesStatus =
      selectedStatus === "all" || order.status === selectedStatus;
    return inOrderDateRange && inDueDateRange && matchesSearch && matchesStatus;
  });

  function getStatusDetails(order) {
    const now = new Date();
    const dueDate = new Date(order.due_date);
    const completedDate =
      order.status === "completed" ? new Date(order.updated_at) : null;

    // Calculate days difference
    const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
    const daysLate = completedDate
      ? Math.ceil((completedDate - dueDate) / (1000 * 60 * 60 * 24))
      : Math.ceil((now - dueDate) / (1000 * 60 * 60 * 24));

    let statusClass = "";
    let statusMessage = "";

    switch (order.status) {
      case "completed":
        if (daysLate > 0) {
          statusClass = daysLate > 5 ? "text-red-600" : "text-orange-600";
          statusMessage = `Completed late (${daysLate} ${daysLate === 1 ? "day" : "days"} late)`;
        } else {
          statusClass = "text-green-600";
          statusMessage = "Completed on time";
        }
        break;
      case "in progress":
      case "pending":
        if (daysUntilDue < 0) {
          statusClass = "text-red-600";
          statusMessage = `Overdue by ${Math.abs(daysUntilDue)} ${Math.abs(daysUntilDue) === 1 ? "day" : "days"}`;
        } else if (daysUntilDue === 0) {
          statusClass = "text-orange-600";
          statusMessage = "Due today";
        } else if (daysUntilDue === 1) {
          statusClass = "text-orange-600";
          statusMessage = "Due tomorrow";
        } else {
          statusClass =
            order.status === "pending" ? "text-gray-600" : "text-blue-600";
          statusMessage = `Due in ${daysUntilDue} days`;
        }
        break;
    }

    return {
      mainStatus: order.status,
      statusClass,
      statusMessage,
    };
  }

  // Replace the getSelectedEmployeeName function with a reactive one
  $: getSelectedEmployeeName = () => {
    if (selectedEmployee === "all") return "All Employees";
    const employee = data.employees.find((e) => e.id === selectedEmployee);
    return employee
      ? `${employee.first_name} ${employee.last_name}`
      : "Unknown Employee";
  };
</script>

<div class="p-6 space-y-6">
  <!-- Header Section -->
  <div class="flex justify-between items-center">
    <div class="flex items-center gap-4">
      <div class="bg-primary/10 p-3 rounded-lg">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-6 h-6 text-primary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M16 8v8m-4-5v5M8 8v8m-4-5v5"
          />
        </svg>
      </div>
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Tailor Performance</h1>
        <p class="text-sm text-gray-500">
          Monitor and analyze tailor productivity
        </p>
      </div>
    </div>
  </div>

  <!-- Replace the Filters Card section -->
  <div class="bg-white p-4 rounded-lg shadow-md">
    <div class="flex flex-row flex-nowrap gap-4 w-full">
      <!-- Order Date Range -->
      <div class="w-full">
        <label class="block text-sm font-medium text-gray-700 mb-1"
          >Order Date Range</label
        >
        <div class="flex items-center gap-2">
          <input
            type="date"
            id="order-date-start"
            bind:value={orderDateRange.start}
            on:change={validateDateRanges}
            class="flex-1 px-3 py-2 border rounded-lg bg-gray-50 text-sm"
          />
          <span class="text-gray-400">to</span>
          <input
            type="date"
            id="order-date-end"
            bind:value={orderDateRange.end}
            on:change={validateDateRanges}
            class="flex-1 px-3 py-2 border rounded-lg bg-gray-50 text-sm"
          />
        </div>
      </div>

      <!-- Due Date Range -->
      <div class="w-full">
        <label class="block text-sm font-medium text-gray-700 mb-1"
          >Due Date Range</label
        >
        <div class="flex items-center gap-2">
          <input
            type="date"
            id="due-date-start"
            bind:value={dueDateRange.start}
            on:change={validateDateRanges}
            class="flex-1 px-3 py-2 border rounded-lg bg-gray-50 text-sm"
          />
          <span class="text-gray-400">to</span>
          <input
            type="date"
            id="due-date-end"
            bind:value={dueDateRange.end}
            on:change={validateDateRanges}
            class="flex-1 px-3 py-2 border rounded-lg bg-gray-50 text-sm"
          />
        </div>
      </div>

      <!-- Tailor Select -->
      <div class="w-full flex justify-end flex-col">
        <select
          bind:value={selectedEmployee}
          class="w-full px-3 py-2 border rounded-lg bg-gray-50 text-sm"
        >
          <option value="all">All Tailors</option>
          {#each data.employees as employee}
            <option value={employee.id}>
              {formatName(employee.first_name, employee.last_name)}
            </option>
          {/each}
        </select>
      </div>

      <!-- Status Select -->
      <div class="w-full flex justify-end flex-col">
        <select
          bind:value={selectedStatus}
          class="w-full px-3 py-2 border rounded-lg bg-gray-50 text-sm"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="in progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <!-- Clear Filters Button -->
      <div class="w-full flex justify-end flex-col">
        <button
          on:click={clearFilters}
          class="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
        >
          Clear All
        </button>
      </div>
    </div>
  </div>

  <!-- Replace the Orders Table and Metrics Cards sections with this new layout -->
  <div class="space-y-4">
    <!-- Top row: Key Metrics Overview -->
    <div class="grid grid-cols-4 gap-4">
      <!-- Quick Stats -->
      <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div class="text-lg font-semibold text-gray-900">{metrics.totalOrders}</div>
        <div class="text-sm text-gray-500">Total Orders</div>
      </div>
      <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div class="text-lg font-semibold text-green-600">{metrics.completedOrders}</div>
        <div class="text-sm text-gray-500">Completed Orders</div>
      </div>
      <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div class="text-lg font-semibold text-red-600">{metrics.lateOrders}</div>
        <div class="text-sm text-gray-500">Late Orders</div>
      </div>
      <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div class="text-lg font-semibold text-primary">{metrics.efficiencyRate}%</div>
        <div class="text-sm text-gray-500">On-Time Rate</div>
      </div>
    </div>

    <!-- Middle row: Employee Performance and Analysis -->
    <div class="grid grid-cols-3 gap-4">
      <!-- Employee Ranking Card - Larger and more prominent -->
      <div class="bg-white p-4 rounded-lg shadow-md col-span-1">
        <h3 class="text-sm font-semibold text-gray-800 mb-3">Top Performers</h3>
        <div class="space-y-3">
          {#each (metrics.employeeComparison || []).slice(0, 5) as employee, i}
            <div class="p-3 {i === 0 ? 'bg-green-50' : 'bg-gray-50'} rounded-lg">
              <div class="flex items-center justify-between">
                <div>
                  <div class="font-medium">{employee.name}</div>
                  <div class="text-xs text-gray-600">
                    {employee.metrics.totalOrders} orders • {employee.metrics.onTimeDeliveryRate}% on-time
                  </div>
                </div>
                <div class="text-sm font-semibold {i === 0 ? 'text-green-600' : 'text-gray-600'}">
                  {employee.metrics.avgCompletionTime}d avg
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <!-- Time Analysis and Workload Cards -->
      <div class="space-y-4 col-span-2">
        <!-- Time Analysis -->
        <div class="grid grid-cols-2 gap-4">
          <div class="bg-white p-4 rounded-lg shadow-md">
            <h3 class="text-sm font-semibold text-gray-800 mb-3">Completion Times</h3>
            <div class="space-y-2">
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600">Fastest</span>
                <span class="font-semibold text-green-600">{metrics.fastestCompletion}d</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600">Average</span>
                <span class="font-semibold text-blue-600">{metrics.averageCompletionTime}d</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600">Slowest</span>
                <span class="font-semibold text-red-600">{metrics.slowestCompletion}d</span>
              </div>
            </div>
          </div>

          <!-- Workload Distribution -->
          <div class="bg-white p-4 rounded-lg shadow-md">
            <h3 class="text-sm font-semibold text-gray-800 mb-3">Weekly Distribution</h3>
            <div class="space-y-2">
              {#each Object.entries(metrics.workloadDistribution || {}) as [day, count]}
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-600">{day}</span>
                  <span class="font-semibold">{count}</span>
                </div>
              {/each}
            </div>
          </div>
        </div>

        <!-- Uniform Type Analysis -->
        <div class="bg-white p-4 rounded-lg shadow-md">
          <h3 class="text-sm font-semibold text-gray-800 mb-3">Uniform Type Analysis</h3>
          <div class="grid grid-cols-3 gap-4">
            {#each ['upper', 'lower', 'both'] as type}
              <div class="p-3 bg-gray-50 rounded-lg">
                <div class="text-sm font-medium capitalize">{type}</div>
                <div class="text-lg font-semibold text-blue-600">
                  {metrics.averageTimePerUniform?.[type] || '0'}d
                </div>
                <div class="text-xs text-gray-500">avg. completion</div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom row: Orders Table -->
    <div class="bg-white rounded-lg shadow-md">
      <div class="p-4 border-b">
        <div class="flex justify-between items-center">
          <h2 class="text-lg font-semibold">Order Details</h2>
          <input 
            type="text"
            bind:value={searchQuery}
            placeholder="Search orders..."
            class="px-4 py-2 border rounded-lg w-64"
          />
        </div>
      </div>
      <!-- Existing table code with the new columns -->
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-muted">
              <th
                class="p-3 text-left font-semibold cursor-pointer hover:bg-gray-100"
                on:click={() => toggleSort("created_at")}
              >
                Order Date {#if sortState.column === "created_at"}
                  <span class="ml-1"
                    >{sortState.direction === "asc" ? "↑" : "↓"}</span
                  >
                {/if}
              </th>
              <th
                class="p-3 text-left font-semibold cursor-pointer hover:bg-gray-100"
                on:click={() => toggleSort("due_date")}
              >
                Due Date {#if sortState.column === "due_date"}
                  <span class="ml-1"
                    >{sortState.direction === "asc" ? "↑" : "↓"}</span
                  >
                {/if}
              </th>
              <th
                class="p-3 text-left font-semibold cursor-pointer hover:bg-gray-100"
                on:click={() => toggleSort("student")}
              >
                Student Details {#if sortState.column === "student"}
                  <span class="ml-1"
                    >{sortState.direction === "asc" ? "↑" : "↓"}</span
                  >
                {/if}
              </th>
              <th
                class="p-3 text-left font-semibold cursor-pointer hover:bg-gray-100"
                on:click={() => toggleSort("employee")}
              >
                Assigned Tailor {#if sortState.column === "employee"}
                  <span class="ml-1"
                    >{sortState.direction === "asc" ? "↑" : "↓"}</span
                  >
                {/if}
              </th>
              <th class="p-3 text-left font-semibold">
                Days to Complete / Estimated
              </th>
              <th class="p-3 text-left font-semibold">Order Status</th>
            </tr>
          </thead>
          <tbody>
            {#each filteredOrders as order}
              {@const workInfo = calculateWorkDuration(order)}
              <tr class="border-b hover:bg-gray-50">
                <td class="p-3">
                  <div class="space-y-1">
                    <div class="font-medium">
                      {formatDate(order.created_at)}
                    </div>
                    <div class="text-xs text-gray-500">Order #{order.id}</div>
                  </div>
                </td>
                <td class="p-3">
                  <div class="space-y-1">
                    <div class="font-medium">{formatDate(order.due_date)}</div>
                    {#if order.status === 'completed' && order.updated_at}
                      <div class="text-xs text-gray-500">
                        Completed: {formatDate(order.updated_at)}
                      </div>
                    {/if}
                  </div>
                </td>
                <td class="p-3">
                  <div class="space-y-1">
                    <div class="font-medium">
                      {formatName(
                        order.student?.first_name,
                        order.student?.last_name
                      )}
                    </div>
                    <div class="text-xs text-gray-500">
                      {order.student?.course?.course_code || "No course"}
                    </div>
                  </div>
                </td>
                <td class="p-3">
                  {#if order.employee}
                    <div class="font-medium">
                      {formatName(
                        order.employee.first_name,
                        order.employee.last_name
                      )}
                    </div>
                  {:else}
                    <div class="text-gray-500">Unassigned</div>
                  {/if}
                </td>
                <td class="p-3">
                  {#if order.status === 'completed'}
                    {#if order.updated_at}
                      {@const days = (new Date(order.updated_at) - new Date(order.created_at)) / (1000 * 60 * 60 * 24)}
                      <div class="text-sm">
                        <span class="font-medium">{days.toFixed(1)} days</span>
                      </div>
                    {/if}
                  {:else}
                    {#if metrics.predictedCompletions[order.id]}
                      <div class="text-sm">
                        <span class="text-gray-600">Est. {metrics.predictedCompletions[order.id].days} days</span>
                        <span class="text-xs text-gray-400 block">
                          Based on {order.status === 'pending' ? 'general' : `${order.employee.first_name}'s`} 
                          {order.uniform_type} wear average
                        </span>
                      </div>
                    {:else}
                      <div class="text-sm text-gray-400">
                        No data to estimate
                      </div>
                    {/if}
                  {/if}
                </td>
                <td class="p-3">
                  {#if order}
                    {@const status = getStatusDetails(order)}
                    <div class="space-y-1">
                      <span
                        class={`px-2 py-1 text-xs font-medium rounded-full
                                              ${
                                                status.mainStatus ===
                                                "completed"
                                                  ? "bg-green-100 text-green-800"
                                                  : status.mainStatus ===
                                                      "in progress"
                                                    ? "bg-blue-100 text-blue-800"
                                                    : "bg-gray-100 text-gray-800"
                                              }`}
                      >
                        {status.mainStatus}
                      </span>
                      <div class={`text-xs ${status.statusClass}`}>
                        {status.statusMessage}
                      </div>
                    </div>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>
