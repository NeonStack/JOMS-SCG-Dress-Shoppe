<script>
  import { Chart, registerables } from "chart.js";
  import { onMount, onDestroy } from "svelte";
  import { fade } from "svelte/transition";
  import AIInsights from "$lib/components/dashboard/AIInsights.svelte";
  import * as ExcelJS from "exceljs";

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
      description: "Total number of students registered in the system",
      type: "students",
    },
    {
      title: "Total Orders",
      value: data.basicStats.totalOrders,
      color: "from-primary to-primary-dark",
      description: "Total number of uniform orders placed",
      type: "orders",
    },
    {
      title: "Completion Rate",
      value: formatPercent(data.basicStats.completionRate),
      color: "from-green-500 to-green-600",
      description: "Percentage of completed orders out of total orders",
      type: "completion",
    },
    {
      title: "Total Revenue",
      value: formatCurrency(data.basicStats.totalRevenue),
      color: "from-purple-500 to-purple-600",
      description: "Total revenue from all paid orders",
      type: "revenue",
    },
  ];

  const timeMetrics = [
    {
      title: "Overdue Orders",
      value: data.timeBasedMetrics.overdueOrders,
      color: "from-red-500 to-red-600",
      description: "Orders past their due date and not completed",
      type: "overdue",
    },
    {
      title: "Due Within 7 Days",
      value: data.timeBasedMetrics.upcomingDue,
      color: "from-yellow-500 to-yellow-600",
      description: "Orders due from today to next 7 days (inclusive)",
      type: "upcoming",
    },
    {
      title: "Avg Completion",
      value: `${data.timeBasedMetrics.averageCompletionTime} days`,
      color: "from-blue-500 to-blue-600",
      description: "Average time to complete an order",
      type: "completion_time",
    },
    {
      title: "Rush Orders",
      value: data.timeBasedMetrics.rushOrders,
      color: "from-orange-500 to-orange-600",
      description: "Orders with 3 or fewer days between order and due date",
      type: "rush",
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
  let selectedRevenueType = "order"; // Add this new state
  const timeFrames = ["day", "week", "month", "year"];

  // Add AI data state
  let aiData = null;
  let aiLoading = true;

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

    const timeData = data.financialMetrics.revenueOverTime[selectedTimeFrame];
    let labels = Object.keys(timeData);

    // Special sorting for months
    if (selectedTimeFrame === "month") {
      const monthOrder = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      labels = labels.sort(
        (a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b)
      );
    } else {
      labels = labels.sort();
    }

    const datasets = [
      {
        label: `Revenue by ${selectedRevenueType === "order" ? "Order Date" : "Payment Date"}`,
        data: labels.map((key) => {
          const orderAmount = timeData[key];
          if (selectedRevenueType === "payment") {
            // Use payment_date for revenue when payment type is selected
            return orderAmount.paymentRevenue || 0;
          }
          return orderAmount.orderRevenue || 0;
        }),
        borderColor: "#B73233",
        backgroundColor: "rgba(183, 50, 51, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ];

    revenueChart = new Chart(revenueChartEl, {
      type: "line",
      data: { labels, datasets },
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

    const values = labels.map((key) => {
      const item =
        data.additionalMetrics.averageOrderValueOverTime[selectedTimeFrame][
          key
        ];
      return item.count > 0 ? (item.total / item.count).toFixed(2) : 0;
    });

    averageOrderValueChart = new Chart(averageOrderValueChartEl, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: `Average Order Value (${selectedTimeFrame})`,
            data: values,
            borderColor: "#E85D2F",
            backgroundColor: "rgba(232, 93, 47, 0.1)",
            fill: true,
            tension: 0.4,
            spanGaps: true, // This ensures continuous line even with missing data
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

  onMount(async () => {
    try {
      const response = await fetch("/api/ai");
      if (response.ok) {
        aiData = await response.json();
      } else {
        console.error("Failed to load AI insights");
      }
    } catch (error) {
      console.error("Error fetching AI insights:", error);
    } finally {
      aiLoading = false;
    }
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

  $: if (selectedTimeFrame || selectedRevenueType) {
    updateCharts(); // Update charts when time frame changes
  }

  // State for modals
  let activeModal = null;
  let modalData = null;

  // Function to handle card clicks
  async function handleCardClick(metric) {
    try {
      let details;
      switch (metric) {
        case "students":
          details = {
            title: "Student List",
            data: data.studentAnalytics.studentList,
            columns: ["Name", "Course", "Gender"],
          };
          break;
        case "orders":
          details = {
            title: "Order List",
            data: data.orderMetrics.allOrders,
            columns: ["Student", "Type", "Status", "Amount"],
          };
          break;
        case "completion":
          details = {
            title: "Completion Statistics",
            data: data.orderMetrics.completionDetails,
            columns: ["Status", "Count", "Percentage"],
          };
          break;
        case "revenue":
          details = {
            title: "Revenue Details",
            data: data.financialMetrics.revenueDetails,
            columns: ["Category", "Amount", "Percentage"],
          };
          break;
        case "overdue":
          details = {
            title: "Overdue Orders",
            data: data.timeBasedMetrics.additionalMetrics.overdueDetails,
            columns: ["Student", "Due Date", "Days Overdue"],
          };
          break;
        case "upcoming":
          details = {
            title: "Upcoming Due Orders",
            data: data.timeBasedMetrics.additionalMetrics.upcomingDueDetails,
            columns: ["Student", "Due Date", "Status"],
          };
          break;
        case "completion_time":
          details = {
            title: "Completion Time Details",
            data: data.timeBasedMetrics.additionalMetrics.avgCompletionDetails
              .breakdown,
            columns: ["Student", "Days to Complete", "Completed At"],
          };
          break;
        case "rush":
          details = {
            title: "Rush Orders",
            data: data.timeBasedMetrics.additionalMetrics.rushOrderDetails,
            columns: ["Student", "Order Date", "Due Date", "Days to Complete"],
          };
          break;
      }
      modalData = details;
      activeModal = metric;
    } catch (error) {
      console.error("Error loading details:", error);
    }
  }

  function closeModal() {
    activeModal = null;
    modalData = null;
  }

  async function generateExcelReport() {
    const workbook = new ExcelJS.Workbook();

    // Summary Sheet
    const summarySheet = workbook.addWorksheet("Summary");
    summarySheet.columns = [
      { header: "Metric", key: "metric", width: 20 },
      { header: "Value", key: "value", width: 15 },
      { header: "Description", key: "description", width: 40 },
    ];

    // Add basic metrics
    [...metrics, ...timeMetrics].forEach((metric) => {
      summarySheet.addRow({
        metric: metric.title,
        value: metric.value,
        description: metric.description,
      });
    });

    // Orders Sheet
    const ordersSheet = workbook.addWorksheet("Recent Orders");
    ordersSheet.columns = [
      { header: "Student", key: "student", width: 20 },
      { header: "Ordered At", key: "orderedAt", width: 15 },
      { header: "Due Date", key: "dueDate", width: 15 },
      { header: "Status", key: "status", width: 15 },
      { header: "Amount", key: "amount", width: 15 },
    ];

    data.orderMetrics.recentOrders.forEach((order) => {
      ordersSheet.addRow({
        student: order.student,
        orderedAt: new Date(order.orderedAt).toLocaleDateString(),
        dueDate: new Date(order.dueDate).toLocaleDateString(),
        status: order.status,
        amount: order.amount,
      });
    });

    // Order Status Sheet
    const statusSheet = workbook.addWorksheet("Order Status");
    statusSheet.columns = [
      { header: "Status", key: "status", width: 15 },
      { header: "Count", key: "count", width: 10 },
    ];

    Object.entries(data.orderMetrics.byStatus).forEach(([status, count]) => {
      statusSheet.addRow({ status, count });
    });

    // Revenue Data Sheet
    const revenueSheet = workbook.addWorksheet("Revenue Data");
    revenueSheet.columns = [
      { header: "Period", key: "period", width: 15 },
      { header: "Revenue", key: "revenue", width: 15 },
    ];

    const timeData = data.financialMetrics.revenueOverTime[selectedTimeFrame];
    Object.entries(timeData).forEach(([period, data]) => {
      revenueSheet.addRow({
        period,
        revenue: data.orderRevenue,
      });
    });

    // Course Enrollment Sheet
    const courseSheet = workbook.addWorksheet("Course Enrollment");
    courseSheet.columns = [
      { header: "Course", key: "course", width: 20 },
      { header: "Students", key: "students", width: 10 },
    ];

    Object.entries(data.studentAnalytics.courseEnrollment).forEach(
      ([course, count]) => {
        courseSheet.addRow({ course, students: count });
      }
    );

    // Gender Distribution Sheet
    const genderSheet = workbook.addWorksheet("Gender Distribution");
    genderSheet.columns = [
      { header: "Gender", key: "gender", width: 15 },
      { header: "Count", key: "count", width: 10 },
    ];

    Object.entries(data.studentAnalytics.genderDistribution).forEach(
      ([gender, count]) => {
        genderSheet.addRow({ gender, count });
      }
    );

    // Detailed Students Sheet
    const studentsSheet = workbook.addWorksheet("Detailed Students");
    studentsSheet.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "First Name", key: "firstName", width: 15 },
      { header: "Last Name", key: "lastName", width: 15 },
      { header: "Gender", key: "gender", width: 10 },
      { header: "Course", key: "course", width: 15 },
      { header: "Contact", key: "contact", width: 15 },
      { header: "Address", key: "address", width: 30 },
      { header: "Registration Date", key: "created", width: 15 },
    ];

    data.rawData.detailedStudents.forEach((student) => {
      studentsSheet.addRow({
        id: student.id,
        firstName: student.first_name,
        lastName: student.last_name,
        gender: student.gender,
        course: student.courses?.course_code || "N/A",
        contact: student.contact_number || "N/A",
        address: student.address || "N/A",
        created: new Date(student.created_at).toLocaleDateString(),
      });
    });

    // Detailed Orders Sheet
    const detailedOrdersSheet = workbook.addWorksheet("Detailed Orders");
    detailedOrdersSheet.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Student", key: "student", width: 20 },
      { header: "Type", key: "type", width: 10 },
      { header: "Status", key: "status", width: 15 },
      { header: "Due Date", key: "dueDate", width: 15 },
      { header: "Total Amount", key: "total", width: 15 },
      { header: "Amount Paid", key: "paid", width: 15 },
      { header: "Balance", key: "balance", width: 15 },
      { header: "Payment Status", key: "paymentStatus", width: 15 },
      { header: "Assigned To", key: "employee", width: 20 },
      { header: "Order Date", key: "created", width: 15 },
      { header: "Completion Date", key: "completed", width: 15 },
    ];

    data.rawData.detailedOrders.forEach((order) => {
      detailedOrdersSheet.addRow({
        id: order.id,
        student: `${order.students?.first_name} ${order.students?.last_name}`,
        type: order.uniform_type,
        status: order.status,
        dueDate: new Date(order.due_date).toLocaleDateString(),
        total: order.total_amount,
        paid: order.amount_paid,
        balance: order.balance,
        paymentStatus: order.payment_status,
        employee: order.profiles
          ? `${order.profiles.first_name} ${order.profiles.last_name}`
          : "Unassigned",
        created: new Date(order.created_at).toLocaleDateString(),
        completed: order.completed_at
          ? new Date(order.completed_at).toLocaleDateString()
          : "Not completed",
      });
    });

    // Courses Sheet
    const coursesSheet = workbook.addWorksheet("Courses");
    coursesSheet.columns = [
      { header: "Course Code", key: "code", width: 15 },
      { header: "Description", key: "description", width: 40 },
      { header: "Created At", key: "created", width: 15 },
    ];

    data.rawData.courses.forEach((course) => {
      coursesSheet.addRow({
        code: course.course_code,
        description: course.description || "N/A",
        created: new Date(course.created_at).toLocaleDateString(),
      });
    });

    // Employees Sheet
    const employeesSheet = workbook.addWorksheet("Employees");
    employeesSheet.columns = [
      { header: "First Name", key: "firstName", width: 15 },
      { header: "Last Name", key: "lastName", width: 15 },
      { header: "Role", key: "role", width: 15 },
      { header: "Contact", key: "contact", width: 15 },
      { header: "Position", key: "position", width: 20 },
      { header: "Start Date", key: "created", width: 15 },
    ];

    data.rawData.employees.forEach((employee) => {
      employeesSheet.addRow({
        firstName: employee.first_name,
        lastName: employee.last_name,
        role: employee.role,
        contact: employee.contact_number || "N/A",
        position: employee.position || "N/A",
        created: new Date(employee.created_at).toLocaleDateString(),
      });
    });

    // Measurements Sheet
    const measurementsSheet = workbook.addWorksheet("Student Measurements");
    measurementsSheet.columns = [
      { header: "Student", key: "student", width: 25 },
      { header: "Course", key: "course", width: 15 },
      { header: "Measurement Type", key: "type", width: 20 },
      { header: "Value (cm)", key: "value", width: 15 },
    ];

    data.rawData.measurements.forEach((student) => {
      const measurements = student.measurements || {};
      Object.entries(measurements).forEach(([type, value]) => {
        measurementsSheet.addRow({
          student: `${student.first_name} ${student.last_name}`,
          course: student.courses?.course_code || "N/A",
          type: type.replace(/_/g, " ").toLowerCase(),
          value: value,
        });
      });
    });

    // Uniform Configurations Sheet
    const configSheet = workbook.addWorksheet("Uniform Configurations");
    configSheet.columns = [
      { header: "Course", key: "course", width: 15 },
      { header: "Gender", key: "gender", width: 10 },
      { header: "Type", key: "type", width: 15 },
      { header: "Base Price", key: "price", width: 15 },
      { header: "Measurement Specs", key: "specs", width: 40 },
    ];

    data.rawData.uniformConfigs.forEach((config) => {
      configSheet.addRow({
        course: config.courses?.course_code || "N/A",
        gender: config.gender,
        type: config.wear_type,
        price: formatCurrency(config.base_price),
        specs: JSON.stringify(config.measurement_specs),
      });
    });

    // Payment Tracking Sheet
    const paymentSheet = workbook.addWorksheet("Payment History");
    paymentSheet.columns = [
      { header: "Order ID", key: "id", width: 10 },
      { header: "Student", key: "student", width: 25 },
      { header: "Course", key: "course", width: 15 },
      { header: "Total Amount", key: "total", width: 15 },
      { header: "Amount Paid", key: "paid", width: 15 },
      { header: "Balance", key: "balance", width: 15 },
      { header: "Payment Status", key: "status", width: 15 },
      { header: "Payment Date", key: "date", width: 15 },
      { header: "Updated by", key: "updatedBy", width: 20 },
    ];

    data.rawData.paymentTracking.forEach((payment) => {
      paymentSheet.addRow({
        id: payment.id,
        student: `${payment.students?.first_name} ${payment.students?.last_name}`,
        course: payment.students?.courses?.course_code || "N/A",
        total: formatCurrency(payment.total_amount),
        paid: formatCurrency(payment.amount_paid),
        balance: formatCurrency(payment.balance),
        status: payment.payment_status,
        date: payment.payment_date
          ? new Date(payment.payment_date).toLocaleDateString()
          : "N/A",
        updatedBy: payment.payment_updated_by || "N/A",
      });
    });

    // Style all sheets
    workbook.eachSheet((sheet) => {
      sheet.getRow(1).font = { bold: true };
      sheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
      };

      // Add borders to all cells
      sheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
      });
    });

    // Generate and download the file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dashboard-report-${new Date().toISOString().split("T")[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
</script>

<div
  class="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200"
>
  <div class="p-3 max-md:p-4 space-y-8 max-md:space-y-6">
    <!-- Header -->
    <div
      class="flex max-md:flex-col max-md:space-y-2 justify-between items-center"
    >
      <div class="flex gap-3 items-center">
        <div class="bg-primary/10 p-3 rounded-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-6 h-6 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              fill="currentColor"
              d="M3 13h8V3H3zm0 8h8v-6H3zm10 0h8V11h-8zm0-18v6h8V3z"
            />
          </svg>
        </div>
        <h1
          class="text-3xl max-md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-dark"
        >
          Dashboard Overview
        </h1>
      </div>
      <div class="text-sm max-md:text-xs text-gray-500">
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

    <!-- Add this button after the dashboard header, before the Key Metrics Cards section -->
    <div class="flex justify-end mb-4">
      <button
        on:click={generateExcelReport}
        class="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors shadow-md"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586L7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z"
            clip-rule="evenodd"
          />
        </svg>
        Generate Report
      </button>
    </div>

    <!-- Key Metrics Cards -->
    <div class="grid grid-cols-4 max-md:grid-cols-1 gap-6 max-md:gap-3">
      {#each metrics as metric}
        <div
          class="group relative flex cursor-pointer"
          on:click={() => handleCardClick(metric.type)}
          on:keydown={(e) => e.key === "Enter" && handleCardClick(metric.type)}
          role="button"
          tabindex="0"
        >
          <div
            class="absolute inset-0 bg-gradient-to-r {metric.color} rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity"
          ></div>
          <div
            class="relative bg-white p-6 rounded-2xl shadow transition-transform transform hover:scale-105 border border-gray-200 w-full flex flex-col"
          >
            <h3 class="text-gray-600 font-medium">{metric.title}</h3>
            <p
              class="text-2xl font-bold mt-2 bg-clip-text text-transparent bg-gradient-to-r {metric.color}"
            >
              {metric.value}
            </p>
            <p class="text-xs text-gray-500 mt-2">{metric.description}</p>
          </div>
        </div>
      {/each}
      {#each timeMetrics as metric}
        <div
          class="group relative flex cursor-pointer"
          on:click={() => handleCardClick(metric.type)}
          on:keydown={(e) => e.key === "Enter" && handleCardClick(metric.type)}
          role="button"
          tabindex="0"
        >
          <div
            class="absolute inset-0 bg-gradient-to-r {metric.color} rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity"
          ></div>
          <div
            class="relative bg-white p-6 rounded-2xl shadow transition-transform transform hover:scale-105 border border-gray-200 w-full flex flex-col"
          >
            <h3 class="text-gray-600 font-medium">{metric.title}</h3>
            <p
              class="text-2xl font-bold mt-2 bg-clip-text text-transparent bg-gradient-to-r {metric.color}"
            >
              {metric.value}
            </p>
            <p class="text-xs text-gray-500 mt-2">{metric.description}</p>
          </div>
        </div>
      {/each}
    </div>

    <AIInsights {aiData} loading={aiLoading} />

    <!-- Recent Orders Table -->
    <div class="bg-white/90 p-6 max-md:p-3 rounded-2xl shadow-lg border">
      <h3 class="text-lg font-bold mb-4">5 Recent Orders</h3>
      <div class="overflow-x-auto max-md:-mx-3">
        <!-- Added negative margin for mobile -->
        <table class="min-w-full max-md:text-[11px]">
          <!-- Reduced font size further -->
          <thead class="bg-gray-50">
            <tr>
              <th
                class="px-4 max-md:px-2 py-2 text-left text-xs font-medium text-gray-500"
                >Student</th
              >
              <th
                class="px-4 max-md:px-2 py-2 text-left text-xs font-medium text-gray-500 max-md:hidden"
                >Ordered At</th
              >
              <!-- Hide on mobile -->
              <th
                class="px-4 max-md:px-2 py-2 text-left text-xs font-medium text-gray-500"
                >Due Date</th
              >
              <th
                class="px-4 max-md:px-2 py-2 text-left text-xs font-medium text-gray-500"
                >Status</th
              >
              <th
                class="px-4 max-md:px-2 py-2 text-left text-xs font-medium text-gray-500"
                >Amount</th
              >
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            {#each data.orderMetrics.recentOrders as order}
              <tr>
                <td class="px-4 max-md:px-2 py-2 text-sm max-md:text-[11px]"
                  >{order.student}</td
                >
                <td
                  class="px-4 max-md:px-2 py-2 text-sm max-md:text-[11px] max-md:hidden"
                  >{new Date(order.orderedAt).toLocaleDateString()}</td
                >
                <!-- Hide on mobile -->
                <td class="px-4 max-md:px-2 py-2 text-sm max-md:text-[11px]"
                  >{new Date(order.dueDate).toLocaleDateString()}</td
                >
                <td class="px-4 max-md:px-2 py-2 text-sm max-md:text-[11px]">
                  <span
                    class="px-2 py-1 rounded-full text-xs max-md:text-[10px] max-md:px-1.5 max-md:py-0.5
                              {order.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : order.status === 'in progress'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'}"
                  >
                    {order.status}
                  </span>
                </td>
                <td class="px-4 max-md:px-2 py-2 text-sm max-md:text-[11px]"
                  >{formatCurrency(order.amount)}</td
                >
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Time-based Charts Section -->
    <div class="space-y-6 max-md:space-y-4">
      <div
        class="flex max-md:flex-col max-md:space-y-2 justify-between items-center"
      >
        <h2 class="text-2xl max-md:text-xl font-bold text-gray-800">
          Time-Based Analytics
        </h2>
        <!-- Keep only the time frame selector in the header -->
        <select
          bind:value={selectedTimeFrame}
          class="px-4 py-2 max-md:w-full border rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary"
        >
          {#each timeFrames as frame}
            <option value={frame}>
              {frame.charAt(0).toUpperCase() + frame.slice(1)}
            </option>
          {/each}
        </select>
      </div>

      <div class="grid grid-cols-12 gap-6 max-md:gap-4">
        <!-- Revenue Trend card with internal toggle -->
        <div
          class="col-span-12 lg:col-span-6 bg-white/90 p-6 max-md:p-4 rounded-2xl shadow-lg border"
        >
          <div
            class="flex max-md:flex-col max-md:space-y-2 justify-between items-center mb-2"
          >
            <h3 class="text-xl max-md:text-lg font-bold">Revenue Trend</h3>
            <select
              bind:value={selectedRevenueType}
              class="px-3 py-1 text-sm max-md:w-full border rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="order">By Order Date</option>
              <option value="payment">By Payment Date</option>
            </select>
          </div>
          <p class="text-xs text-gray-500 mb-4">
            Track revenue patterns over time based on order or payment dates
          </p>
          <div class="h-80 max-md:h-60">
            <canvas bind:this={revenueChartEl}></canvas>
          </div>
        </div>

        <div
          class="col-span-12 lg:col-span-6 bg-white/90 p-6 max-md:p-4 rounded-2xl shadow-lg border"
        >
          <h3 class="text-xl max-md:text-lg font-bold mb-2">
            Average Order Value
          </h3>
          <p class="text-xs text-gray-500 mb-4">
            Average value of order over time
          </p>
          <div class="h-80 max-md:h-60">
            <canvas
              bind:this={averageOrderValueChartEl}
              id="averageOrderValueChart"
            ></canvas>
          </div>
        </div>
      </div>
    </div>

    <!-- Static Analytics Section -->
    <div class="space-y-6 max-md:space-y-4">
      <h2 class="text-2xl max-md:text-xl font-bold text-gray-800">
        Current Status Overview
      </h2>

      <!-- Order & Payment Stats -->
      <div class="grid grid-cols-12 gap-6 max-md:gap-4">
        <div
          class="col-span-12 md:col-span-6 lg:col-span-4 bg-white/90 p-6 max-md:p-4 rounded-2xl shadow-lg border"
        >
          <h3 class="text-lg font-bold mb-2">Order Status</h3>
          <p class="text-xs text-gray-500 mb-4">
            Distribution of orders by their current status
          </p>
          <div class="h-72 max-md:h-60">
            <canvas bind:this={orderStatusChartEl}></canvas>
          </div>
        </div>

        <div
          class="col-span-12 md:col-span-6 lg:col-span-4 bg-white/90 p-6 max-md:p-4 rounded-2xl shadow-lg border"
        >
          <h3 class="text-lg font-bold mb-2">Payment Status</h3>
          <p class="text-xs text-gray-500 mb-4">
            Overview of order payment statuses
          </p>
          <div class="h-72 max-md:h-60">
            <canvas bind:this={paymentStatusChartEl}></canvas>
          </div>
        </div>

        <div
          class="col-span-12 md:col-span-6 lg:col-span-4 bg-white/90 p-6 max-md:p-4 rounded-2xl shadow-lg border"
        >
          <h3 class="text-lg font-bold mb-2">Completion Rate</h3>
          <p class="text-xs text-gray-500 mb-4">
            Ratio of orders completed on time vs late
          </p>
          <div class="h-72 max-md:h-60">
            <canvas bind:this={completionPerformanceChartEl}></canvas>
          </div>
        </div>
      </div>

      <!-- Student Analytics -->
      <div class="grid grid-cols-12 gap-6 max-md:gap-4">
        <div
          class="col-span-12 lg:col-span-8 bg-white/90 p-6 max-md:p-4 rounded-2xl shadow-lg border"
        >
          <h3 class="text-lg font-bold mb-2">Student Courses</h3>
          <p class="text-xs text-gray-500 mb-4">
            Number of students registered per course
          </p>
          <div class="h-80 max-md:h-60">
            <canvas bind:this={courseEnrollmentChartEl}></canvas>
          </div>
        </div>

        <div
          class="col-span-12 lg:col-span-4 bg-white/90 p-6 max-md:p-4 rounded-2xl shadow-lg border"
        >
          <h3 class="text-lg font-bold mb-2">Gender Distribution</h3>
          <p class="text-xs text-gray-500 mb-4">
            Distribution of students by gender
          </p>
          <div class="h-80 max-md:h-60">
            <canvas bind:this={genderChartEl}></canvas>
          </div>
        </div>
      </div>

      <!-- Performance Metrics -->
      <div class="grid grid-cols-12 gap-6 max-md:gap-4">
        <div
          class="col-span-12 md:col-span-6 bg-white/90 p-6 max-md:p-4 rounded-2xl shadow-lg border"
        >
          <h3 class="text-lg font-bold mb-2">Weekly Distribution</h3>
          <p class="text-xs text-gray-500 mb-4">
            Pattern of orders received throughout the week
          </p>
          <div class="h-72 max-md:h-60">
            <canvas bind:this={busyDaysChartEl}></canvas>
          </div>
        </div>

        <div
          class="col-span-12 md:col-span-6 bg-white/90 p-6 max-md:p-4 rounded-2xl shadow-lg border"
        >
          <h3 class="text-lg font-bold mb-2">Tailor Performance</h3>
          <p class="text-xs text-gray-500 mb-4">
            Number of orders completed by each tailor
          </p>
          <div class="h-72 max-md:h-60">
            <canvas bind:this={employeePerformanceChartEl}></canvas>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Add Modal Component -->
{#if activeModal && modalData}
  <div
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    transition:fade
    on:click={closeModal}
  >
    <div
      class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
      on:click|stopPropagation
    >
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-xl font-bold text-gray-800">{modalData.title}</h3>
        <button class="text-gray-500 hover:text-gray-700" on:click={closeModal}>
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              {#each modalData.columns as column}
                <th
                  class="px-4 py-2 text-left text-sm font-medium text-gray-500"
                  >{column}</th
                >
              {/each}
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            {#each modalData.data as row}
              <tr class="hover:bg-gray-50">
                {#each Object.values(row) as cell}
                  <td class="px-4 py-2 text-sm text-gray-900">{cell}</td>
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </div>
{/if}

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

  /* Mobile-specific styles */
  @media (max-width: 768px) {
    canvas {
      max-height: 300px;
    }

    .chart-container {
      margin-bottom: 1rem;
    }

    /* Add smooth scrolling for table */
    .overflow-x-auto {
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none; /* Firefox */
    }

    .overflow-x-auto::-webkit-scrollbar {
      display: none; /* Chrome, Safari and Opera */
    }
  }
</style>
