<script>
    import { Chart, registerables } from 'chart.js';
    import { onMount } from 'svelte';
    
    Chart.register(...registerables);
    
    export let data;
    const {
        basicStats,
        genderDistribution,
        orderStats,
        revenueStats,
        orderStatusDistribution,
        topCourses,
        monthlyRevenueTrend,
        uniformTypeDistribution,
        employeePerformance,
        dueOrders,
        avgOrderValue,
        paymentStatusDistribution
    } = data;

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(value);
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    usePointStyle: true,
                    padding: 15,
                    font: {
                        size: 11
                    }
                }
            }
        }
    };

    onMount(() => {
        // Order Status Chart
        new Chart(document.getElementById('orderStatusChart'), {
            type: 'doughnut',
            data: {
                labels: orderStatusDistribution?.map(item => item.status.toUpperCase()) || [],
                datasets: [{
                    data: orderStatusDistribution?.map(item => item.count) || [],
                    backgroundColor: ['#B73233', '#E85D2F', '#64748b'],
                    borderWidth: 0
                }]
            },
            options: {
                ...chartOptions,
                cutout: '75%'
            }
        });

        // Gender Distribution Chart
        new Chart(document.getElementById('genderChart'), {
            type: 'pie',
            data: {
                labels: genderDistribution?.map(item => item.gender) || [],
                datasets: [{
                    data: genderDistribution?.map(item => item.count) || [],
                    backgroundColor: ['#B73233', '#E85D2F']
                }]
            },
            options: chartOptions
        });

        // Top Courses Chart
        new Chart(document.getElementById('topCoursesChart'), {
            type: 'bar',
            data: {
                labels: topCourses?.map(item => item.courses.course_code) || [],
                datasets: [{
                    label: 'Student Count',
                    data: topCourses?.map(item => item.count) || [],
                    backgroundColor: '#B73233'
                }]
            },
            options: {
                ...chartOptions,
                indexAxis: 'y'
            }
        });

        // Monthly Revenue Trend Chart
        const monthlyData = monthlyRevenueTrend?.reduce((acc, item) => {
            const month = new Date(item.created_at).toLocaleString('default', { month: 'short' });
            acc[month] = (acc[month] || 0) + item.amount_paid;
            return acc;
        }, {}) || {};

        new Chart(document.getElementById('revenueChart'), {
            type: 'line',
            data: {
                labels: Object.keys(monthlyData),
                datasets: [{
                    label: 'Monthly Revenue',
                    data: Object.values(monthlyData),
                    borderColor: '#B73233',
                    tension: 0.4
                }]
            },
            options: chartOptions
        });
    });
</script>

<div class="p-6 space-y-6">
    <!-- Key Metrics -->
    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div class="bg-white p-4 rounded-lg shadow">
            <h3 class="text-secondary text-xs font-medium">Total Students</h3>
            <p class="text-xl font-bold text-foreground">{basicStats.totalStudents?.[0]?.count || 0}</p>
        </div>
        
        <div class="bg-white p-4 rounded-lg shadow">
            <h3 class="text-secondary text-xs font-medium">Total Orders</h3>
            <p class="text-xl font-bold text-foreground">{basicStats.totalOrders?.[0]?.count || 0}</p>
        </div>
        
        <div class="bg-white p-4 rounded-lg shadow">
            <h3 class="text-secondary text-xs font-medium">Total Revenue</h3>
            <p class="text-xl font-bold text-foreground">{formatCurrency(basicStats.totalRevenue)}</p>
        </div>
        
        <div class="bg-white p-4 rounded-lg shadow">
            <h3 class="text-secondary text-xs font-medium">Due Orders</h3>
            <p class="text-xl font-bold text-primary">{dueOrders}</p>
        </div>

        <div class="bg-white p-4 rounded-lg shadow">
            <h3 class="text-secondary text-xs font-medium">Avg Order Value</h3>
            <p class="text-xl font-bold text-foreground">{formatCurrency(avgOrderValue)}</p>
        </div>

        <div class="bg-white p-4 rounded-lg shadow">
            <h3 class="text-secondary text-xs font-medium">Today's Orders</h3>
            <p class="text-xl font-bold text-foreground">{orderStats.today}</p>
        </div>
    </div>

    <!-- Charts Grid -->
    <div class="grid grid-cols-12 gap-6">
        <!-- Revenue Trend - Wider -->
        <div class="col-span-12 lg:col-span-8 bg-white p-4 rounded-lg shadow">
            <h3 class="text-sm font-semibold mb-4">Revenue Trend</h3>
            <div class="h-64">
                <canvas id="revenueChart"></canvas>
            </div>
        </div>

        <!-- Order Status - Smaller -->
        <div class="col-span-12 md:col-span-6 lg:col-span-4 bg-white p-4 rounded-lg shadow">
            <h3 class="text-sm font-semibold mb-4">Order Status</h3>
            <div class="h-64">
                <canvas id="orderStatusChart"></canvas>
            </div>
        </div>

        <!-- Gender Distribution - Smaller -->
        <div class="col-span-12 md:col-span-6 lg:col-span-4 bg-white p-4 rounded-lg shadow">
            <h3 class="text-sm font-semibold mb-4">Gender Distribution</h3>
            <div class="h-64">
                <canvas id="genderChart"></canvas>
            </div>
        </div>

        <!-- Top Courses - Wider -->
        <div class="col-span-12 lg:col-span-8 bg-white p-4 rounded-lg shadow">
            <h3 class="text-sm font-semibold mb-4">Top Courses</h3>
            <div class="h-64">
                <canvas id="topCoursesChart"></canvas>
            </div>
        </div>
    </div>

    <!-- Performance Metrics -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Orders Overview -->
        <div class="bg-white p-4 rounded-lg shadow">
            <h3 class="text-sm font-semibold mb-4">Orders Timeline</h3>
            <div class="space-y-4">
                <div class="flex justify-between items-center">
                    <span class="text-secondary text-sm">Today</span>
                    <span class="text-lg font-semibold">{orderStats.today}</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-secondary text-sm">This Week</span>
                    <span class="text-lg font-semibold">{orderStats.thisWeek}</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-secondary text-sm">This Month</span>
                    <span class="text-lg font-semibold">{orderStats.thisMonth}</span>
                </div>
            </div>
        </div>

        <!-- Revenue Breakdown -->
        <div class="bg-white p-4 rounded-lg shadow">
            <h3 class="text-sm font-semibold mb-4">Revenue Breakdown</h3>
            <div class="space-y-4">
                <div class="flex justify-between items-center">
                    <span class="text-secondary text-sm">Today</span>
                    <span class="text-lg font-semibold">{formatCurrency(revenueStats.today)}</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-secondary text-sm">This Month</span>
                    <span class="text-lg font-semibold">{formatCurrency(revenueStats.thisMonth)}</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-secondary text-sm">This Year</span>
                    <span class="text-lg font-semibold">{formatCurrency(revenueStats.thisYear)}</span>
                </div>
            </div>
        </div>

        <!-- Payment Status -->
        <div class="bg-white p-4 rounded-lg shadow">
            <h3 class="text-sm font-semibold mb-4">Payment Status</h3>
            <div class="space-y-4">
                {#each paymentStatusDistribution as status}
                <div class="flex justify-between items-center">
                    <span class="text-secondary text-sm">{status.status}</span>
                    <span class="text-lg font-semibold">{status.count}</span>
                </div>
                {/each}
            </div>
        </div>
    </div>
</div>

<style>
    .bg-white {
        transition: all 0.2s ease-in-out;
    }
    .bg-white:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    }
</style>
