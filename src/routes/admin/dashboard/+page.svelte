<script>
    import { Chart, registerables } from 'chart.js';
    import { onMount } from 'svelte';
    
    Chart.register(...registerables);
    export let data;

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(value);
    };

    const formatPercent = (value) => `${Number(value).toFixed(1)}%`;

    // Common chart options
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: { usePointStyle: true, padding: 15, font: { size: 11 } }
            }
        }
    };

    onMount(() => {
        // Revenue Trend Line Chart
        new Chart(document.getElementById('revenueChart'), {
            type: 'line',
            data: {
                labels: Object.keys(data.financialMetrics.monthlyRevenue),
                datasets: [{
                    label: 'Monthly Revenue',
                    data: Object.values(data.financialMetrics.monthlyRevenue),
                    borderColor: '#B73233',
                    backgroundColor: 'rgba(183, 50, 51, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4
                }]
            },
            options: {
                ...commonOptions,
                scales: {
                    y: { beginAtZero: true },
                }
            }
        });

        // Order Status Distribution
        new Chart(document.getElementById('orderStatusChart'), {
            type: 'doughnut',
            data: {
                labels: Object.keys(data.orderMetrics.byStatus),
                datasets: [{
                    data: Object.values(data.orderMetrics.byStatus),
                    backgroundColor: ['#B73233', '#E85D2F', '#64748b'],
                    borderWidth: 0
                }]
            },
            options: { ...commonOptions, cutout: '75%' }
        });

        // Gender Distribution
        new Chart(document.getElementById('genderChart'), {
            type: 'pie',
            data: {
                labels: Object.keys(data.studentAnalytics.genderDistribution),
                datasets: [{
                    data: Object.values(data.studentAnalytics.genderDistribution),
                    backgroundColor: ['#B73233', '#E85D2F']
                }]
            },
            options: commonOptions
        });

        // Course Enrollment Bar Chart
        new Chart(document.getElementById('courseEnrollmentChart'), {
            type: 'bar',
            data: {
                labels: Object.keys(data.studentAnalytics.courseEnrollment),
                datasets: [{
                    label: 'Students Enrolled',
                    data: Object.values(data.studentAnalytics.courseEnrollment),
                    backgroundColor: '#B73233'
                }]
            },
            options: {
                ...commonOptions,
                indexAxis: 'y',
                scales: {
                    x: { beginAtZero: true }
                }
            }
        });

        // Weekly Order Distribution
        new Chart(document.getElementById('busyDaysChart'), {
            type: 'radar',
            data: {
                labels: Object.keys(data.timeBasedMetrics.busyDays),
                datasets: [{
                    label: 'Orders per Day',
                    data: Object.values(data.timeBasedMetrics.busyDays),
                    backgroundColor: 'rgba(183, 50, 51, 0.2)',
                    borderColor: '#B73233',
                    pointBackgroundColor: '#B73233'
                }]
            },
            options: commonOptions
        });

        // Employee Performance Chart
        const employeeData = Object.entries(data.performanceMetrics.employeeStats);
        new Chart(document.getElementById('employeePerformanceChart'), {
            type: 'bar',
            data: {
                labels: employeeData.map(([name]) => name),
                datasets: [
                    {
                        label: 'Completed Orders',
                        data: employeeData.map(([_, stats]) => stats.completed),
                        backgroundColor: '#B73233'
                    },
                    {
                        label: 'Pending Orders',
                        data: employeeData.map(([_, stats]) => stats.pending),
                        backgroundColor: '#E85D2F'
                    }
                ]
            },
            options: {
                ...commonOptions,
                scales: {
                    x: { stacked: true },
                    y: { stacked: true, beginAtZero: true }
                }
            }
        });

        // Quarterly Revenue Chart
        new Chart(document.getElementById('quarterlyRevenueChart'), {
            type: 'bar',
            data: {
                labels: Object.keys(data.financialMetrics.revenueByQuarter),
                datasets: [{
                    label: 'Quarterly Revenue',
                    data: Object.values(data.financialMetrics.revenueByQuarter),
                    backgroundColor: '#B73233',
                    borderRadius: 8
                }]
            },
            options: {
                ...commonOptions,
                scales: {
                    y: { 
                        beginAtZero: true,
                        ticks: { callback: value => formatCurrency(value) }
                    }
                }
            }
        });

        // Payment Status Chart
        new Chart(document.getElementById('paymentStatusChart'), {
            type: 'pie',
            data: {
                labels: ['Fully Paid', 'Partial', 'Not Paid'],
                datasets: [{
                    data: [
                        data.financialMetrics.paymentStats.fullyPaid,
                        data.financialMetrics.paymentStats.partial,
                        data.financialMetrics.paymentStats.notPaid
                    ],
                    backgroundColor: ['#22c55e', '#eab308', '#ef4444']
                }]
            },
            options: commonOptions
        });

        // Delivery Performance Chart
        new Chart(document.getElementById('deliveryPerformanceChart'), {
            type: 'doughnut',
            data: {
                labels: ['On Time', 'Late'],
                datasets: [{
                    data: [
                        data.timeBasedMetrics.deliveryPerformance.onTime,
                        data.timeBasedMetrics.deliveryPerformance.late
                    ],
                    backgroundColor: ['#22c55e', '#ef4444']
                }]
            },
            options: { ...commonOptions, cutout: '70%' }
        });
    });
</script>

<div class="p-6 space-y-6">
    <!-- Key Metrics Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        {#each [
            { title: 'Total Students', value: data.basicStats.totalStudents },
            { title: 'Total Orders', value: data.basicStats.totalOrders },
            { title: 'Completion Rate', value: formatPercent(data.basicStats.completionRate), color: 'text-green-600' },
            { title: 'Total Revenue', value: formatCurrency(data.basicStats.totalRevenue) }
        ] as metric}
        <div class="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <h3 class="text-gray-500 text-sm font-medium">{metric.title}</h3>
            <p class="text-xl font-bold mt-1 {metric.color || ''}">{metric.value}</p>
        </div>
        {/each}
    </div>

    <!-- Main Charts Grid -->
    <div class="grid grid-cols-12 gap-6">
        <!-- Revenue Trend -->
        <div class="col-span-12 lg:col-span-8 bg-white p-4 rounded-lg shadow-sm">
            <h3 class="text-lg font-semibold mb-4">Revenue Trend</h3>
            <div class="h-72">
                <canvas id="revenueChart"></canvas>
            </div>
        </div>

        <!-- Order Status -->
        <div class="col-span-12 lg:col-span-4 bg-white p-4 rounded-lg shadow-sm">
            <h3 class="text-lg font-semibold mb-4">Order Status</h3>
            <div class="h-72">
                <canvas id="orderStatusChart"></canvas>
            </div>
        </div>

        <!-- Course Enrollment -->
        <div class="col-span-12 lg:col-span-8 bg-white p-4 rounded-lg shadow-sm">
            <h3 class="text-lg font-semibold mb-4">Course Enrollment</h3>
            <div class="h-96">
                <canvas id="courseEnrollmentChart"></canvas>
            </div>
        </div>

        <!-- Gender Distribution -->
        <div class="col-span-12 lg:col-span-4 bg-white p-4 rounded-lg shadow-sm">
            <h3 class="text-lg font-semibold mb-4">Gender Distribution</h3>
            <div class="h-72">
                <canvas id="genderChart"></canvas>
            </div>
        </div>

        <!-- Busy Days Distribution -->
        <div class="col-span-12 md:col-span-6 bg-white p-4 rounded-lg shadow-sm">
            <h3 class="text-lg font-semibold mb-4">Weekly Order Pattern</h3>
            <div class="h-72">
                <canvas id="busyDaysChart"></canvas>
            </div>
        </div>

        <!-- Employee Performance -->
        <div class="col-span-12 md:col-span-6 bg-white p-4 rounded-lg shadow-sm">
            <h3 class="text-lg font-semibold mb-4">Employee Performance</h3>
            <div class="h-72">
                <canvas id="employeePerformanceChart"></canvas>
            </div>
        </div>

        <!-- Quarterly Revenue -->
        <div class="col-span-12 md:col-span-6 bg-white p-4 rounded-lg shadow-sm">
            <h3 class="text-lg font-semibold mb-4">Quarterly Revenue</h3>
            <div class="h-72">
                <canvas id="quarterlyRevenueChart"></canvas>
            </div>
        </div>

        <!-- Payment Status -->
        <div class="col-span-12 md:col-span-6 bg-white p-4 rounded-lg shadow-sm">
            <h3 class="text-lg font-semibold mb-4">Payment Status Distribution</h3>
            <div class="h-72">
                <canvas id="paymentStatusChart"></canvas>
            </div>
        </div>

        <!-- Delivery Performance -->
        <div class="col-span-12 md:col-span-6 bg-white p-4 rounded-lg shadow-sm">
            <h3 class="text-lg font-semibold mb-4">Delivery Performance</h3>
            <div class="h-72">
                <canvas id="deliveryPerformanceChart"></canvas>
            </div>
            <div class="text-center mt-4">
                <p class="text-sm text-gray-600">On-Time Delivery Rate</p>
                <p class="text-2xl font-bold text-green-600">
                    {formatPercent(data.timeBasedMetrics.deliveryPerformance.percentOnTime)}
                </p>
            </div>
        </div>

        <!-- High Priority Orders -->
        <div class="col-span-12 md:col-span-6 bg-white p-4 rounded-lg shadow-sm">
            <h3 class="text-lg font-semibold mb-4">High Priority Orders</h3>
            <div class="overflow-auto max-h-72">
                <table class="min-w-full">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Student</th>
                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Due Date</th>
                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Amount</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
                        {#each data.orderMetrics.highPriorityOrders as order}
                        <tr>
                            <td class="px-4 py-2 text-sm">{order.student}</td>
                            <td class="px-4 py-2 text-sm">{new Date(order.dueDate).toLocaleDateString()}</td>
                            <td class="px-4 py-2 text-sm">{formatCurrency(order.amount)}</td>
                        </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- Additional Metrics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {#each [
            { title: 'Overdue Orders', value: data.timeBasedMetrics.overdueOrders, color: 'text-red-600' },
            { title: 'Due This Week', value: data.timeBasedMetrics.upcomingDue, color: 'text-yellow-600' },
            { title: 'Avg Completion (Days)', value: data.timeBasedMetrics.averageCompletionTime },
            { title: 'Rush Orders', value: data.timeBasedMetrics.rushOrders, color: 'text-orange-600' }
        ] as metric}
        <div class="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <h3 class="text-gray-500 text-sm font-medium">{metric.title}</h3>
            <p class="text-xl font-bold mt-1 {metric.color || ''}">{metric.value}</p>
        </div>
        {/each}
    </div>

    <!-- Processing Times Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        {#each [
            { title: 'Average Processing Time', value: `${data.timeBasedMetrics.processingTimes.average} days` },
            { title: 'Fastest Completion', value: `${data.timeBasedMetrics.processingTimes.fastest} days` },
            { title: 'Slowest Completion', value: `${data.timeBasedMetrics.processingTimes.slowest} days` }
        ] as metric}
        <div class="bg-white p-4 rounded-lg shadow-sm">
            <h3 class="text-gray-500 text-sm font-medium">{metric.title}</h3>
            <p class="text-xl font-bold mt-1">{metric.value}</p>
        </div>
        {/each}
    </div>
</div>

<style>
    :global(.chart-container) {
        position: relative;
    }
</style>
