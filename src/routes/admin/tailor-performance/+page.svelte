<script>
  import { get } from "svelte/store";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";

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
  let completedDateRange = { start: "", end: "" }; // Add this line

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

    // Set min/max for completed date range
    if (completedDateRange.start) {
      const startInput = document.getElementById("completed-date-end");
      if (startInput) startInput.min = completedDateRange.start;
    }
    if (completedDateRange.end) {
      const endInput = document.getElementById("completed-date-start");
      if (endInput) endInput.max = completedDateRange.end;
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
    const completedOrders = historicalData.filter(
      (o) => o.status === "completed"
    );

    if (order.status === "pending") {
      // For pending orders, use general average for this uniform type
      const typeHistory = completedOrders.filter(
        (o) => o.uniform_type === order.uniform_type
      );

      if (typeHistory.length > 0) {
        const avgTime =
          typeHistory.reduce((acc, o) => {
            const days =
              (new Date(o.completed_at) - new Date(o.created_at)) /
              (1000 * 60 * 60 * 24);
            return acc + days;
          }, 0) / typeHistory.length;

        return {
          days: avgTime.toFixed(1),
          source: "general",
        };
      }
    }

    if (order.status === "in progress" && order.employee_id) {
      // For in-progress orders, look at specific employee's history with this uniform type
      const employeeHistory = completedOrders.filter(
        (o) =>
          o.employee_id === order.employee_id &&
          o.uniform_type === order.uniform_type
      );

      if (employeeHistory.length > 0) {
        const avgTime =
          employeeHistory.reduce((acc, o) => {
            const days =
              (new Date(o.completed_at) - new Date(o.created_at)) /
              (1000 * 60 * 60 * 24);
            return acc + days;
          }, 0) / employeeHistory.length;

        return {
          days: avgTime.toFixed(1),
          source: "employee",
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
    now.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison

    metrics = {
      totalOrders: filteredOrders.length,
      completedOrders: filteredOrders.filter((o) => o.status === "completed")
        .length,
      pendingOrders: filteredOrders.filter((o) => o.status === "pending")
        .length,
      inProgressOrders: filteredOrders.filter((o) => o.status === "in progress")
        .length,
      lateOrders: filteredOrders.filter((o) => {
        const dueDate = new Date(o.due_date);
        dueDate.setHours(0, 0, 0, 0); // Reset time to start of day

        if (o.status === "completed") {
          // For completed orders, check if they were completed after due date
          const completedDate = new Date(o.completed_at);
          return completedDate > dueDate;
        } else if (o.status === "in progress" || o.status === "pending") {
          // For non-completed orders, only count if they're past due date (not including today)
          return now > dueDate;
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
      const end = new Date(order.completed_at);
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
      (o) => new Date(o.completed_at) <= new Date(o.due_date)
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
        (new Date(order.completed_at) - new Date(order.created_at)) /
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
        (new Date(order.completed_at) - new Date(order.created_at)) /
        (1000 * 60 * 60 * 24);
      if (days > slowest) slowest = days;
    });
    return slowest.toFixed(1);
  }

  function calculateAverageTimeByUniformType(orders) {
    const completed = orders.filter((o) => o.status === "completed");
    const byType = completed.reduce((acc, order) => {
      const days =
        (new Date(order.completed_at) - new Date(order.created_at)) /
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
      order.status === "completed" ? new Date(order.completed_at) : new Date();
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
    completedDateRange = { start: "", end: "" }; // Add this line
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
    const completedDate = order.completed_at 
      ? new Date(order.completed_at).setHours(0, 0, 0, 0)
      : null;

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

    const inCompletedDateRange = 
      !completedDateRange.start && !completedDateRange.end ? true :
      completedDate && 
      (!completedDateRange.start || 
        completedDate >= new Date(completedDateRange.start).setHours(0, 0, 0, 0)) &&
      (!completedDateRange.end || 
        completedDate <= new Date(completedDateRange.end).setHours(23, 59, 59, 999));

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
    return inOrderDateRange && inDueDateRange && inCompletedDateRange && matchesSearch && matchesStatus;
  });

  function getStatusDetails(order) {
    const now = new Date();
    const dueDate = new Date(order.due_date);
    const completedDate =
      order.status === "completed" ? new Date(order.completed_at) : null;

    // Calculate days difference
    const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
    const daysLate = completedDate
      ? Math.floor((completedDate - dueDate) / (1000 * 60 * 60 * 24))
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

  // Add tab state
  $: activeTab = $page.url.searchParams.get("tab") || "overview";

  // Update tab click handler
  function setActiveTab(tab) {
    const url = new URL($page.url);
    url.searchParams.set("tab", tab);
    goto(url, { replaceState: true });
  }

  // Modified ranking calculation to get fastest completion per employee
  function calculateFastestCompletions(orders) {
    // Group orders by employee
    const employeeOrders = orders
      .filter((order) => order.status === "completed" && order.employee)
      .reduce((acc, order) => {
        if (!acc[order.employee.id]) {
          acc[order.employee.id] = [];
        }
        acc[order.employee.id].push(order);
        return acc;
      }, {});

    // Find fastest completion for each employee
    const fastestPerEmployee = Object.entries(employeeOrders).map(
      ([employeeId, orders]) => {
        return orders
          .map((order) => {
            const startDate = new Date(order.created_at);
            const completedDate = new Date(order.completed_at);
            const dueDate = new Date(order.due_date);

            const availableDays = (dueDate - startDate) / (1000 * 60 * 60 * 24);
            const daysUsed =
              (completedDate - startDate) / (1000 * 60 * 60 * 24);
            const timeEfficiency = (daysUsed / availableDays) * 100;

            return {
              orderId: order.id,
              employee: order.employee,
              student: order.student,
              uniformType: order.uniform_type,
              availableDays: availableDays.toFixed(1),
              daysUsed: daysUsed.toFixed(1),
              timeEfficiency: timeEfficiency.toFixed(1),
              orderDate: startDate,
              completedDate: completedDate,
              dueDate: dueDate,
            };
          })
          .reduce((fastest, current) => {
            return !fastest ||
              parseFloat(current.timeEfficiency) <
                parseFloat(fastest.timeEfficiency)
              ? current
              : fastest;
          }, null);
      }
    );

    // Sort by efficiency (ascending - lower is better)
    return fastestPerEmployee
      .filter((record) => record !== null)
      .sort(
        (a, b) => parseFloat(a.timeEfficiency) - parseFloat(b.timeEfficiency)
      );
  }

  $: fastestCompletions = calculateFastestCompletions(
    data.performanceData || []
  );

  // Add these new functions before the script end
  function calculateMostCompletedOrders(orders) {
    const completedByEmployee = orders
      .filter((order) => order.status === "completed" && order.employee)
      .reduce((acc, order) => {
        const empId = order.employee.id;
        if (!acc[empId]) {
          acc[empId] = {
            employee: order.employee,
            totalOrders: 0,
            completedOrders: [],
          };
        }
        acc[empId].totalOrders++;
        acc[empId].completedOrders.push(order);
        return acc;
      }, {});

    return Object.values(completedByEmployee).sort(
      (a, b) => b.totalOrders - a.totalOrders
    );
  }

  function calculateOneDayCompletions(orders) {
    const quickCompletions = orders
      .filter((order) => {
        if (!order.status === "completed" || !order.employee) return false;
        const startDate = new Date(order.created_at);
        const completedDate = new Date(order.completed_at);
        const daysDiff = (completedDate - startDate) / (1000 * 60 * 60 * 24);
        return daysDiff <= 1;
      })
      .reduce((acc, order) => {
        const empId = order.employee.id;
        if (!acc[empId]) {
          acc[empId] = {
            employee: order.employee,
            totalQuickOrders: 0,
            orders: [],
          };
        }
        acc[empId].totalQuickOrders++;
        acc[empId].orders.push(order);
        return acc;
      }, {});

    return Object.values(quickCompletions).sort(
      (a, b) => b.totalQuickOrders - a.totalQuickOrders
    );
  }

  $: mostCompletedOrders = calculateMostCompletedOrders(
    data.performanceData || []
  );
  $: oneDayCompletions = calculateOneDayCompletions(data.performanceData || []);

  function calculateDailyCompletions(orders) {
    // Group completions by employee and date
    const dailyCompletions = orders
      .filter((order) => order.status === "completed" && order.employee)
      .reduce((acc, order) => {
        const empId = order.employee.id;
        const date = new Date(order.completed_at).toISOString().split("T")[0];

        if (!acc[empId]) {
          acc[empId] = {
            employee: order.employee,
            bestDay: { date: null, count: 0 },
            totalOrders: 0,
            dailyBreakdown: {},
          };
        }

        if (!acc[empId].dailyBreakdown[date]) {
          acc[empId].dailyBreakdown[date] = [];
        }

        acc[empId].dailyBreakdown[date].push(order);
        acc[empId].totalOrders++;

        // Update best day if current date has more completions
        const currentDayCount = acc[empId].dailyBreakdown[date].length;
        if (currentDayCount > acc[empId].bestDay.count) {
          acc[empId].bestDay = {
            date: date,
            count: currentDayCount,
          };
        }

        return acc;
      }, {});

    return Object.values(dailyCompletions)
      .map((record) => ({
        employee: record.employee,
        totalOrders: record.totalOrders,
        bestDay: record.bestDay,
        lastCompleted: orders
          .filter(
            (o) =>
              o.employee?.id === record.employee.id && o.status === "completed"
          )
          .sort(
            (a, b) => new Date(b.completed_at) - new Date(a.completed_at)
          )[0]?.completed_at,
      }))
      .sort((a, b) => b.bestDay.count - a.bestDay.count);
  }

  let completionSortType = "all-time"; // or 'best-day'
  $: completionStats = calculateDailyCompletions(data.performanceData || []);

  function calculateOnTimeCompletions(orders) {
    const onTimeByEmployee = orders
      .filter(
        (order) =>
          order.status === "completed" &&
          order.employee &&
          new Date(order.completed_at) <= new Date(order.due_date)
      )
      .reduce((acc, order) => {
        const empId = order.employee.id;
        if (!acc[empId]) {
          acc[empId] = {
            employee: order.employee,
            onTimeCount: 0,
            totalCompleted: 0,
            lastOnTime: null,
            recentOnTimeOrders: [],
          };
        }

        acc[empId].totalCompleted++;

        if (new Date(order.completed_at) <= new Date(order.due_date)) {
          acc[empId].onTimeCount++;
          acc[empId].recentOnTimeOrders.push(order);
          if (
            !acc[empId].lastOnTime ||
            new Date(order.completed_at) > new Date(acc[empId].lastOnTime)
          ) {
            acc[empId].lastOnTime = order.completed_at;
          }
        }

        return acc;
      }, {});

    return Object.values(onTimeByEmployee)
      .map((record) => ({
        ...record,
        onTimeRate: (
          (record.onTimeCount / record.totalCompleted) *
          100
        ).toFixed(1),
      }))
      .sort(
        (a, b) =>
          // First sort by on-time count
          b.onTimeCount - a.onTimeCount ||
          // Then by on-time rate if counts are equal
          parseFloat(b.onTimeRate) - parseFloat(a.onTimeRate)
      );
  }

  $: onTimeStats = calculateOnTimeCompletions(data.performanceData || []);

  function calculateOverallRankings(
    fastestCompletions,
    completionStats,
    onTimeStats
  ) {
    const employeeRanks = {};

    // Helper function to add rank to employee
    const addRankToEmployee = (employeeId, category, rank) => {
      if (!employeeRanks[employeeId]) {
        employeeRanks[employeeId] = {
          employee: null,
          rankDetails: [],
          categories: {},
          avgRank: 0,
        };
      }
      employeeRanks[employeeId].categories[category] = rank + 1; // +1 because array index starts at 0
    };

    // Record ranks for fastest completions
    fastestCompletions.forEach((record, index) => {
      const empId = record.employee.id;
      employeeRanks[empId] = employeeRanks[empId] || {
        employee: record.employee,
        rankDetails: [],
        categories: {},
        avgRank: 0,
      };
      addRankToEmployee(empId, "fastest", index);
      employeeRanks[empId].rankDetails.push({
        category: "Fastest Completion",
        rank: index + 1,
        detail: `${record.timeEfficiency}% time efficiency`,
      });
    });

    // Record ranks for completion stats (all-time)
    const allTimeStats = completionStats.sort(
      (a, b) => b.totalOrders - a.totalOrders
    );
    allTimeStats.forEach((record, index) => {
      const empId = record.employee.id;
      employeeRanks[empId] = employeeRanks[empId] || {
        employee: record.employee,
        rankDetails: [],
        categories: {},
        avgRank: 0,
      };
      addRankToEmployee(empId, "allTime", index);
      employeeRanks[empId].rankDetails.push({
        category: "Total Completions",
        rank: index + 1,
        detail: `${record.totalOrders} orders completed`,
      });
    });

    // Record ranks for best day
    const bestDayStats = completionStats.sort(
      (a, b) => b.bestDay.count - a.bestDay.count
    );
    bestDayStats.forEach((record, index) => {
      const empId = record.employee.id;
      employeeRanks[empId] = employeeRanks[empId] || {
        employee: record.employee,
        rankDetails: [],
        categories: {},
        avgRank: 0,
      };
      addRankToEmployee(empId, "bestDay", index);
      employeeRanks[empId].rankDetails.push({
        category: "Best Day Record",
        rank: index + 1,
        detail: `${record.bestDay.count} orders in one day`,
      });
    });

    // Record ranks for on-time completion
    onTimeStats.forEach((record, index) => {
      const empId = record.employee.id;
      employeeRanks[empId] = employeeRanks[empId] || {
        employee: record.employee,
        rankDetails: [],
        categories: {},
        avgRank: 0,
      };
      addRankToEmployee(empId, "onTime", index);
      employeeRanks[empId].rankDetails.push({
        category: "On-Time Delivery",
        rank: index + 1,
        detail: `${record.onTimeCount} on-time orders`,
      });
    });

    // Calculate average rank for each employee
    return Object.values(employeeRanks)
      .map((record) => {
        const ranks = Object.values(record.categories);
        record.avgRank = ranks.reduce((a, b) => a + b, 0) / ranks.length;
        return record;
      })
      .sort((a, b) => a.avgRank - b.avgRank); // Lower average rank is better
  }

  $: overallRankings = calculateOverallRankings(
    fastestCompletions,
    completionStats,
    onTimeStats
  );

  // Add pagination state
  let currentPage = 1;
  let rowsPerPage = 10;
  
  // Calculate total pages and paginated orders
  $: totalPages = Math.ceil((filteredOrders?.length || 0) / rowsPerPage);
  $: paginatedOrders = filteredOrders?.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Navigation functions
  function nextPage() {
    if (currentPage < totalPages) currentPage++;
  }

  function prevPage() {
    if (currentPage > 1) currentPage--;
  }

  function goToPage(page) {
    currentPage = page;
  }

  // Reset to first page when filters change
  $: if (searchQuery || selectedEmployee || selectedStatus || orderDateRange || dueDateRange || completedDateRange) {
    currentPage = 1;
  }

  // Generate page numbers for pagination
  $: pageNumbers = Array.from(
    { length: Math.min(5, totalPages) },
    (_, i) => {
      if (totalPages <= 5) return i + 1;
      if (currentPage <= 3) return i + 1;
      if (currentPage >= totalPages - 2) return totalPages - 4 + i;
      return currentPage - 2 + i;
    }
  );
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
          <path fill="currentColor" d="M3 22V8h4v14zm7 0V2h4v20zm7 0v-8h4v8z" />
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

  <!-- Add Tab Navigation -->
  <div class="border-b border-gray-200">
    <nav class="-mb-px flex space-x-8">
      <button
        class="py-4 px-1 {activeTab === 'overview'
          ? 'border-b-2 border-primary text-primary'
          : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
        on:click={() => setActiveTab("overview")}
      >
        Overview
      </button>
      <button
        class="py-4 px-1 {activeTab === 'rankings'
          ? 'border-b-2 border-primary text-primary'
          : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
        on:click={() => setActiveTab("rankings")}
      >
        Rankings
      </button>
    </nav>
  </div>

  {#if activeTab === "overview"}
    <!-- Existing Overview Content -->
    <!-- Replace the Filters Card section -->
    <div class="bg-white p-4 rounded-lg shadow-md">
      <div class="flex flex-col gap-4 w-full">
        <!-- Order Date Range -->
        <div class="w-full">
          <label class="block text-sm font-medium text-gray-700 mb-1"
            >Order Date Range</label
          >
          <div class="flex flex-col sm:flex-row items-center gap-2">
            <input
              type="date"
              id="order-date-start"
              bind:value={orderDateRange.start}
              on:change={validateDateRanges}
              class="w-full px-3 py-2 border rounded-lg bg-gray-50 text-sm"
            />
            <span class="text-gray-400">to</span>
            <input
              type="date"
              id="order-date-end"
              bind:value={orderDateRange.end}
              on:change={validateDateRanges}
              class="w-full px-3 py-2 border rounded-lg bg-gray-50 text-sm"
            />
          </div>
        </div>

        <!-- Due Date Range -->
        <div class="w-full">
          <label class="block text-sm font-medium text-gray-700 mb-1"
            >Due Date Range</label
          >
          <div class="flex flex-col sm:flex-row items-center gap-2">
            <input
              type="date"
              id="due-date-start"
              bind:value={dueDateRange.start}
              on:change={validateDateRanges}
              class="w-full px-3 py-2 border rounded-lg bg-gray-50 text-sm"
            />
            <span class="text-gray-400">to</span>
            <input
              type="date"
              id="due-date-end"
              bind:value={dueDateRange.end}
              on:change={validateDateRanges}
              class="w-full px-3 py-2 border rounded-lg bg-gray-50 text-sm"
            />
          </div>
        </div>

        <!-- Add this after the Due Date Range input in the filters section -->
        <div class="w-full">
          <label class="block text-sm font-medium text-gray-700 mb-1">Completed Date Range</label>
          <div class="flex flex-col sm:flex-row items-center gap-2">
            <input
              type="date"
              id="completed-date-start"
              bind:value={completedDateRange.start}
              on:change={validateDateRanges}
              class="w-full px-3 py-2 border rounded-lg bg-gray-50 text-sm"
            />
            <span class="text-gray-400">to</span>
            <input
              type="date"
              id="completed-date-end"
              bind:value={completedDateRange.end}
              on:change={validateDateRanges}
              class="w-full px-3 py-2 border rounded-lg bg-gray-50 text-sm"
            />
          </div>
        </div>

        <!-- Filters Row -->
        <div class="flex flex-col sm:flex-row gap-4">
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

          <select
            bind:value={selectedStatus}
            class="w-full px-3 py-2 border rounded-lg bg-gray-50 text-sm"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>

          <button
            on:click={clearFilters}
            class="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
          >
            Clear All
          </button>
        </div>
      </div>
    </div>

    <!-- Replace the Orders Table and Metrics Cards sections with this new layout -->
    <div class="space-y-4">
      <!-- Top row: Key Metrics Overview -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <!-- Quick Stats -->
        <div
          class="bg-white p-4 rounded-lg shadow-md border-2 border-primary/10 hover:border-primary/20 transition-all"
        >
          <div class="text-lg font-semibold text-gray-900">
            {metrics.totalOrders}
          </div>
          <div class="text-sm text-gray-500">Total Orders</div>
        </div>
        <div
          class="bg-white p-4 rounded-lg shadow-md border-2 border-green-100 hover:border-green-200 transition-all"
        >
          <div class="text-lg font-semibold text-green-600">
            {metrics.completedOrders}
          </div>
          <div class="text-sm text-gray-500">Completed Orders</div>
        </div>
        <div
          class="bg-white p-4 rounded-lg shadow-md border-2 border-red-100 hover:border-red-200 transition-all"
        >
          <div class="text-lg font-semibold text-red-600">
            {metrics.lateOrders}
          </div>
          <div class="text-sm text-gray-500">Late Orders</div>
        </div>
        <div
          class="bg-white p-4 rounded-lg shadow-md border-2 border-primary/10 hover:border-primary/20 transition-all"
        >
          <div class="text-lg font-semibold text-primary">
            {metrics.efficiencyRate}%
          </div>
          <div class="text-sm text-gray-500">On-Time Rate</div>
        </div>
      </div>

      <!-- Middle row: Employee Performance and Analysis -->
      <div class="grid grid-cols-2 gap-4">
        <!-- Time Analysis and Workload Cards -->
        <div class="space-y-4 col-span-2">
          <!-- Time Analysis -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              class="bg-white p-4 rounded-lg shadow-md border-2 border-blue-100 hover:border-blue-200 transition-all"
            >
              <h3 class="text-sm font-semibold text-gray-800 mb-3">
                Completion Times
              </h3>
              <div class="space-y-2">
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-600">Fastest</span>
                  <span class="font-semibold text-green-600"
                    >{metrics.fastestCompletion}d</span
                  >
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-600">Average</span>
                  <span class="font-semibold text-blue-600"
                    >{metrics.averageCompletionTime}d</span
                  >
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-600">Slowest</span>
                  <span class="font-semibold text-red-600"
                    >{metrics.slowestCompletion}d</span
                  >
                </div>
              </div>
            </div>

            <!-- Workload Distribution -->
            <div
              class="bg-white p-4 rounded-lg shadow-md border-2 border-purple-100 hover:border-purple-200 transition-all"
            >
              <h3 class="text-sm font-semibold text-gray-800 mb-3">
                Weekly Distribution
              </h3>
              <div class="space-y-2">
                {#each Object.entries(metrics.workloadDistribution || {}) as [day, count]}
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-600">{day}</span>
                    <span class="font-semibold">{count}</span>
                  </div>
                {/each}
              </div>
            </div>
            <!-- Uniform Type Analysis -->
            <div
              class="bg-white p-4 rounded-lg shadow-md border-2 border-emerald-100 hover:border-emerald-200 transition-all"
            >
              <h3 class="text-sm font-semibold text-gray-800 mb-3">
                Uniform Type Analysis
              </h3>
              <div class="grid grid-cols-3 gap-4">
                {#each ["upper", "lower", "both"] as type}
                  <div class="p-3 bg-gray-50 rounded-lg">
                    <div class="text-sm font-medium capitalize">{type}</div>
                    <div class="text-lg font-semibold text-blue-600">
                      {metrics.averageTimePerUniform?.[type] || "0"}d
                    </div>
                    <div class="text-xs text-gray-500">avg. completion</div>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom row: Orders Table -->
      <div class="bg-white rounded-lg shadow-md border-2 border-gray-100">
        <div class="p-4 border-b">
          <div
            class="flex flex-col sm:flex-row gap-4 justify-between items-center"
          >
            <h2 class="text-lg font-semibold">Order Details</h2>
            <input
              type="text"
              bind:value={searchQuery}
              placeholder="Search orders..."
              class="w-full sm:w-64 px-4 py-2 border rounded-lg"
            />
          </div>
        </div>
        <!-- Replace the existing table section with this updated version -->
        <div class="overflow-x-auto">
          <table class="w-full min-w-[800px]">
            <!-- Added min-width to prevent squishing -->
            <thead>
              <tr class="bg-muted max-md:whitespace-nowrap">
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
              {#each paginatedOrders as order}
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
                      <div class="font-medium">
                        {formatDate(order.due_date)}
                      </div>
                      {#if order.status === "completed" && order.completed_at}
                        <div class="text-xs text-gray-500">
                          Completed: {formatDate(order.completed_at)}
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
                        {order.student?.course?.course_code || "No course"} -
                        <span class="capitalize">{order.uniform_type}</span>
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
                    {#if order.status === "completed"}
                      {#if order.completed_at}
                        {@const days =
                          (new Date(order.completed_at) -
                            new Date(order.created_at)) /
                          (1000 * 60 * 60 * 24)}
                        <div class="text-sm">
                          <span class="font-medium">{days.toFixed(1)} days</span
                          >
                        </div>
                      {/if}
                    {:else if metrics.predictedCompletions[order.id]}
                      <div class="text-sm">
                        <span class="text-gray-600"
                          >Est. {metrics.predictedCompletions[order.id].days} days</span
                        >
                        <span class="text-xs text-gray-400 block">
                          Based on {order.status === "pending"
                            ? "general"
                            : `${order.employee.first_name}'s`}
                          {order.uniform_type} wear average
                        </span>
                      </div>
                    {:else}
                      <div class="text-sm text-gray-400">
                        No data to estimate
                      </div>
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
          
          <!-- Pagination Controls -->
          <div class="flex items-center justify-between px-4 py-3 border-t">
            <div class="flex items-center text-sm text-gray-500">
              Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, filteredOrders?.length || 0)} of {filteredOrders?.length || 0} entries
            </div>
            <div class="flex items-center gap-2">
              <button
                class="px-3 py-1 rounded border {currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:bg-gray-50'}"
                on:click={prevPage}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              
              {#each pageNumbers as pageNum}
                <button
                  class="px-3 py-1 rounded border {currentPage === pageNum ? 'bg-primary text-white' : 'hover:bg-gray-50'}"
                  on:click={() => goToPage(pageNum)}
                >
                  {pageNum}
                </button>
              {/each}
              
              <button
                class="px-3 py-1 rounded border {currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:bg-gray-50'}"
                on:click={nextPage}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}

  {#if activeTab === "rankings"}
    <!-- Overall Rankings Card -->
    <div class="mb-6">
      <div class="bg-white rounded-lg shadow-md p-6 border-2 border-indigo-100">
        <h2 class="text-lg font-semibold mb-4">Overall Performance Rankings</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          {#each overallRankings.slice(0, 3) as record, i}
            <div
              class="p-4 rounded-lg border {i === 0
                ? 'bg-gradient-to-br from-yellow-50 to-white border-yellow-200'
                : i === 1
                  ? 'bg-gradient-to-br from-gray-50 to-white border-gray-200'
                  : 'bg-gradient-to-br from-amber-50 to-white border-amber-200'}"
            >
              <div class="flex items-center gap-3 mb-4">
                <div
                  class="w-12 h-12 rounded-full flex items-center justify-center
                  {i === 0
                    ? 'bg-yellow-100 text-yellow-700'
                    : i === 1
                      ? 'bg-gray-100 text-gray-700'
                      : 'bg-amber-100 text-amber-700'}"
                >
                  <span class="text-2xl font-bold">#{i + 1}</span>
                </div>
                <div>
                  <div class="font-semibold text-lg">
                    {record.employee.first_name}
                    {record.employee.last_name}
                  </div>
                  <div class="text-sm text-gray-500">
                    Average Rank: {record.avgRank.toFixed(1)}
                  </div>
                </div>
              </div>
              <div class="space-y-2">
                {#each record.rankDetails.sort((a, b) => a.rank - b.rank) as detail}
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-gray-600">{detail.category}</span>
                    <span class="font-medium"
                      >#{detail.rank} ({detail.detail})</span
                    >
                  </div>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Left Column: Fastest Completions -->
      <div
        class="bg-white rounded-lg shadow-md p-6 h-[36rem] flex flex-col border-2 border-cyan-100 hover:border-cyan-200 transition-all"
      >
        <h2 class="text-lg font-semibold mb-4">Fastest Completions</h2>
        <p class="text-xs text-gray-500 mb-4">
          Best time efficiency per tailor
        </p>
        <div class="space-y-3 overflow-auto flex-1">
          {#each fastestCompletions as completion, i}
            <div
              class="p-3 rounded-lg border {i < 3
                ? 'bg-gradient-to-br from-white to-gray-50'
                : 'bg-white'} hover:shadow-sm transition-shadow"
            >
              <div class="flex items-center gap-2 mb-2">
                <span
                  class="px-2 py-1 rounded-full text-sm font-bold
                {i === 0
                    ? 'bg-yellow-100 text-yellow-700'
                    : i === 1
                      ? 'bg-gray-100 text-gray-700'
                      : i === 2
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-gray-50 text-gray-600'}"
                >
                  #{i + 1}
                </span>
                <div class="font-medium text-gray-900">
                  {completion.employee?.first_name}
                  {completion.employee?.last_name}
                </div>
              </div>
              <div class="text-xs text-gray-500 mb-2 capitalize">
                {completion.uniformType} uniform
              </div>
              <div class="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span class="text-gray-500">Time Given</span>
                  <span class="float-right font-medium"
                    >{completion.availableDays}d</span
                  >
                </div>
                <div>
                  <span class="text-gray-500">Used</span>
                  <span class="float-right font-medium text-primary"
                    >{completion.daysUsed}d</span
                  >
                </div>
              </div>
              <div class="mt-2 pt-2 border-t text-right">
                <span
                  class="font-bold {parseFloat(completion.timeEfficiency) <= 50
                    ? 'text-green-600'
                    : parseFloat(completion.timeEfficiency) <= 75
                      ? 'text-blue-600'
                      : 'text-gray-600'}"
                >
                  {completion.timeEfficiency}% of time used
                </span>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <!-- Middle Column: Completion Records -->
      <div
        class="bg-white rounded-lg shadow-md p-6 h-[36rem] flex flex-col border-2 border-violet-100 hover:border-violet-200 transition-all"
      >
        <div class="flex justify-between items-start mb-4">
          <div>
            <h2 class="text-lg font-semibold mb-4">Completion Records</h2>
            <p class="text-xs text-gray-500">Tailor completion statistics</p>
          </div>
          <select
            bind:value={completionSortType}
            class="border rounded-md px-3 py-1 text-sm"
          >
            <option value="all-time">All Time</option>
            <option value="best-day">Within a Day</option>
          </select>
        </div>
        <div class="space-y-3 overflow-auto flex-1">
          {#each completionStats.sort((a, b) => {
            if (completionSortType === "all-time") {
              return b.totalOrders - a.totalOrders;
            } else {
              return b.bestDay.count - a.bestDay.count;
            }
          }) as record, i}
            <div
              class="p-4 rounded-lg border hover:shadow-sm transition-shadow"
            >
              <div class="flex items-center gap-2 mb-3">
                <span
                  class="px-2 py-1 rounded-full text-sm font-bold
                {i === 0
                    ? 'bg-yellow-100 text-yellow-700'
                    : i === 1
                      ? 'bg-gray-100 text-gray-700'
                      : i === 2
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-gray-50 text-gray-600'}"
                >
                  #{i + 1}
                </span>
                <div class="font-medium text-gray-900">
                  {record.employee.first_name}
                  {record.employee.last_name}
                </div>
              </div>

              {#if completionSortType === "all-time"}
                <div class="mt-2">
                  <div class="text-sm text-gray-500">
                    Total Completed Orders
                  </div>
                  <div class="text-xl font-bold text-primary">
                    {record.totalOrders}
                  </div>
                  <div class="text-xs text-gray-400 mt-2">
                    Last completed: {formatDate(record.lastCompleted)}
                  </div>
                </div>
              {:else}
                <div class="mt-2">
                  <div class="text-sm text-gray-500">
                    Most Orders in One Day
                  </div>
                  <div class="text-xl font-bold text-green-600">
                    {record.bestDay.count}
                  </div>
                  <div class="text-xs text-gray-400 mt-2">
                    Achieved on {formatDate(record.bestDay.date)}
                  </div>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>

      <!-- Right Column: On-Time Rankings -->
      <div
        class="bg-white rounded-lg shadow-md p-6 h-[36rem] flex flex-col border-2 border-amber-100 hover:border-amber-200 transition-all"
      >
        <h2 class="text-lg font-semibold mb-4">On-Time Completion</h2>
        <p class="text-xs text-gray-500 mb-4">
          Most orders completed before deadline
        </p>
        <div class="space-y-3 overflow-auto flex-1">
          {#each onTimeStats as record, i}
            <div
              class="p-4 rounded-lg border hover:shadow-sm transition-shadow"
            >
              <div class="flex items-center gap-2 mb-3">
                <span
                  class="px-2 py-1 rounded-full text-sm font-bold
                    {i === 0
                    ? 'bg-yellow-100 text-yellow-700'
                    : i === 1
                      ? 'bg-gray-100 text-gray-700'
                      : i === 2
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-gray-50 text-gray-600'}"
                >
                  #{i + 1}
                </span>
                <div class="font-medium text-gray-900">
                  {record.employee.first_name}
                  {record.employee.last_name}
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4 mb-2">
                <div>
                  <div class="text-sm text-gray-500">On-Time Orders</div>
                  <div class="text-xl font-bold text-green-600">
                    {record.onTimeCount}
                  </div>
                </div>
              </div>

              {#if record.lastOnTime}
                <div class="text-xs text-gray-400 mt-2">
                  Last on-time: {formatDate(record.lastOnTime)}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if}
</div>
