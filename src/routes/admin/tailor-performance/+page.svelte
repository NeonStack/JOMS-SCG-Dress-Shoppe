<script>
    export let data;
    let dateRange = { start: '', end: '' };
    let selectedEmployee = 'all';
    let metrics = {};
    let selectedStatus = "all";
    let searchQuery = '';

    // Add sorting state
    let sortState = {
        column: 'created_at',
        direction: 'desc'
    };

    // Sorting function
    const toggleSort = (column) => {
        if (sortState.column === column) {
            sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc';
        } else {
            sortState = {
                column: column,
                direction: 'asc'
            };
        }
    };

    // Updated sort icons to match course page
    function getSortIcon(column) {
        if (sortState.column !== column) return '';
        return sortState.direction === 'asc' ? '↑' : '↓';
    }

    // Sort orders
    $: sortedOrders = data.performanceData
        ?.filter(order => selectedEmployee === 'all' || order.employee_id === selectedEmployee)
        ?.sort((a, b) => {
            const modifier = sortState.direction === 'asc' ? 1 : -1;
            switch (sortState.column) {
                case 'created_at':
                    return modifier * (new Date(a.created_at) - new Date(b.created_at));
                case 'due_date':
                    return modifier * (new Date(a.due_date) - new Date(b.due_date));
                case 'student':
                    return modifier * ((a.student?.last_name || '') 
                        .localeCompare(b.student?.last_name || ''));
                case 'status':
                    return modifier * (a.status.localeCompare(b.status));
                case 'employee':
                    return modifier * ((a.employee?.last_name || '') 
                        .localeCompare(b.employee?.last_name || ''));
                default:
                    return 0;
            }
        });

    $: calculateMetrics(data.performanceData, orderDateRange, dueDateRange, selectedEmployee);

    // Replace the single dateRange with separate ranges
    let orderDateRange = { start: '', end: '' };
    let dueDateRange = { start: '', end: '' };

    // Date validation function
    function validateDateRanges() {
        // Set min/max for order date range
        if (orderDateRange.start) {
            const startInput = document.getElementById('order-date-end');
            if (startInput) startInput.min = orderDateRange.start;
        }
        if (orderDateRange.end) {
            const endInput = document.getElementById('order-date-start');
            if (endInput) endInput.max = orderDateRange.end;
        }

        // Set min/max for due date range
        if (dueDateRange.start) {
            const startInput = document.getElementById('due-date-end');
            if (startInput) startInput.min = dueDateRange.start;
        }
        if (dueDateRange.end) {
            const endInput = document.getElementById('due-date-start');
            if (endInput) endInput.max = dueDateRange.end;
        }
    }

    // Update calculateMetrics to use both date ranges
    function calculateMetrics(orders, orderDateRange, dueDateRange, employeeId) {
        if (!orders) return;
        
        const filteredOrders = orders.filter(order => {
            const orderDate = new Date(order.created_at).setHours(0, 0, 0, 0);
            const dueDate = new Date(order.due_date).setHours(0, 0, 0, 0);

            const inOrderDateRange = (!orderDateRange.start || 
                orderDate >= new Date(orderDateRange.start).setHours(0, 0, 0, 0)) &&
                (!orderDateRange.end || 
                orderDate <= new Date(orderDateRange.end).setHours(23, 59, 59, 999));
            
            const inDueDateRange = (!dueDateRange.start || 
                dueDate >= new Date(dueDateRange.start).setHours(0, 0, 0, 0)) &&
                (!dueDateRange.end || 
                dueDate <= new Date(dueDateRange.end).setHours(23, 59, 59, 999));

            const matchesEmployee = employeeId === 'all' || order.employee_id === employeeId;
            return inOrderDateRange && inDueDateRange && matchesEmployee;
        });

        metrics = {
            totalOrders: filteredOrders.length,
            completedOrders: filteredOrders.filter(o => o.status === 'completed').length,
            pendingOrders: filteredOrders.filter(o => o.status === 'pending').length,
            inProgressOrders: filteredOrders.filter(o => o.status === 'in progress').length,
            lateOrders: filteredOrders.filter(o => {
                return o.status === 'completed' && 
                       new Date(o.updated_at) > new Date(o.due_date);
            }).length,
            averageCompletionTime: calculateAverageCompletionTime(filteredOrders),
            ordersByDay: calculateOrdersByDay(filteredOrders),
            efficiencyRate: calculateEfficiencyRate(filteredOrders)
        };
    }

    function calculateAverageCompletionTime(orders) {
        const completedOrders = orders.filter(o => o.status === 'completed');
        const totalDays = completedOrders.reduce((acc, order) => {
            const start = new Date(order.created_at);
            const end = new Date(order.updated_at);
            return acc + (end - start) / (1000 * 60 * 60 * 24);
        }, 0);
        return completedOrders.length ? (totalDays / completedOrders.length).toFixed(1) : 0;
    }

    function calculateOrdersByDay(orders) {
        return orders.reduce((acc, order) => {
            const date = new Date(order.created_at).toISOString().split('T')[0];
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {});
    }

    function calculateEfficiencyRate(orders) {
        const completed = orders.filter(o => o.status === 'completed');
        const onTime = completed.filter(o => 
            new Date(o.updated_at) <= new Date(o.due_date)
        );
        return completed.length ? ((onTime.length / completed.length) * 100).toFixed(1) : 0;
    }

    // Improved date formatting
    function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // Update name formatting
    function formatName(first, last) {
        return `${first} ${last}`;
    }

    // Simplified work duration calculation
    function calculateWorkDuration(order) {
        const start = new Date(order.created_at);
        const end = order.status === 'completed' ? new Date(order.updated_at) : new Date();
        const dueDate = new Date(order.due_date);
        const daysTaken = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        const daysOverdue = Math.ceil((end - dueDate) / (1000 * 60 * 60 * 24));
        
        let status;
        if (order.status === 'completed') {
            status = daysOverdue > 5 ? 'Completed (5+ days late)' : 
                    daysOverdue > 0 ? 'Completed (Late)' : 
                    'Completed (On Time)';
        } else {
            status = new Date() > dueDate ? 'Overdue' : order.status;
        }
        
        return {
            days: daysTaken,
            daysOverdue: Math.max(0, daysOverdue),
            status
        };
    }

    function clearFilters() {
        orderDateRange = { start: '', end: '' };
        dueDateRange = { start: '', end: '' };
        selectedEmployee = 'all';
        selectedStatus = "all";
        searchQuery = '';

        // Reset min/max attributes for all date inputs
        ['order-date-start', 'order-date-end', 'due-date-start', 'due-date-end'].forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.min = '';
                input.max = '';
            }
        });
    }

    // Filter orders based on all criteria
    $: filteredOrders = sortedOrders?.filter(order => {
        const orderDate = new Date(order.created_at).setHours(0, 0, 0, 0);
        const dueDate = new Date(order.due_date).setHours(0, 0, 0, 0);
        
        const inOrderDateRange = (!orderDateRange.start || 
            orderDate >= new Date(orderDateRange.start).setHours(0, 0, 0, 0)) &&
            (!orderDateRange.end || 
            orderDate <= new Date(orderDateRange.end).setHours(23, 59, 59, 999));
        
        const inDueDateRange = (!dueDateRange.start || 
            dueDate >= new Date(dueDateRange.start).setHours(0, 0, 0, 0)) &&
            (!dueDateRange.end || 
            dueDate <= new Date(dueDateRange.end).setHours(23, 59, 59, 999));

        const searchTerms = searchQuery.toLowerCase().trim();
        
        // Create full names for easier searching
        const studentFullName = order.student ? 
            `${order.student.first_name} ${order.student.last_name}`.toLowerCase() : '';
        const employeeFullName = order.employee ? 
            `${order.employee.first_name} ${order.employee.last_name}`.toLowerCase() : '';

        const matchesSearch = searchQuery === '' || 
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

        const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
        return inOrderDateRange && inDueDateRange && matchesSearch && matchesStatus;
    });

    function getStatusDetails(order) {
        const now = new Date();
        const dueDate = new Date(order.due_date);
        const completedDate = order.status === 'completed' ? new Date(order.updated_at) : null;
        
        // Calculate days difference
        const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
        const daysLate = completedDate ? 
            Math.ceil((completedDate - dueDate) / (1000 * 60 * 60 * 24)) : 
            Math.ceil((now - dueDate) / (1000 * 60 * 60 * 24));

        let statusClass = '';
        let statusMessage = '';

        switch(order.status) {
            case 'completed':
                if (daysLate > 0) {
                    statusClass = daysLate > 5 ? 'text-red-600' : 'text-orange-600';
                    statusMessage = `Completed late (${daysLate} ${daysLate === 1 ? 'day' : 'days'} late)`;
                } else {
                    statusClass = 'text-green-600';
                    statusMessage = 'Completed on time';
                }
                break;
            case 'in progress':
                if (daysUntilDue < 0) {
                    statusClass = 'text-red-600';
                    statusMessage = `Overdue by ${Math.abs(daysUntilDue)} ${Math.abs(daysUntilDue) === 1 ? 'day' : 'days'}`;
                } else if (daysUntilDue === 0) {
                    statusClass = 'text-orange-600';
                    statusMessage = 'Due today';
                } else if (daysUntilDue === 1) {
                    statusClass = 'text-orange-600';
                    statusMessage = 'Due tomorrow';
                } else {
                    statusClass = 'text-blue-600';
                    statusMessage = `Due in ${daysUntilDue} days`;
                }
                break;
            case 'pending':
                statusClass = 'text-gray-600';
                statusMessage = `Starts in ${daysUntilDue} ${daysUntilDue === 1 ? 'day' : 'days'}`;
                break;
        }

        return {
            mainStatus: order.status,
            statusClass,
            statusMessage
        };
    }
</script>

<div class="p-6 space-y-6">
    <!-- Header Section -->
    <div class="flex justify-between items-center">
        <div class="flex items-center gap-4">
            <div class="bg-primary/10 p-3 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8v8m-4-5v5M8 8v8m-4-5v5"/>
                </svg>
            </div>
            <div>
                <h1 class="text-2xl font-bold text-gray-800">Tailor Performance</h1>
                <p class="text-sm text-gray-500">Monitor and analyze tailor productivity</p>
            </div>
        </div>
    </div>

    <!-- Replace the Filters Card section -->
    <div class="bg-white p-4 rounded-lg shadow-md">
        <div class="flex flex-row flex-nowrap gap-4 w-full">
            <!-- Order Date Range -->
            <div class="w-full">
                <label class="block text-sm font-medium text-gray-700 mb-1">Order Date Range</label>
                <div class="flex items-center gap-2">
                    <input 
                        type="date" 
                        id="order-date-start"
                        bind:value={orderDateRange.start}
                        on:change={validateDateRanges}
                        class="flex-1 px-3 py-2 border rounded-lg bg-gray-50 text-sm"
                    >
                    <span class="text-gray-400">to</span>
                    <input 
                        type="date" 
                        id="order-date-end"
                        bind:value={orderDateRange.end}
                        on:change={validateDateRanges}
                        class="flex-1 px-3 py-2 border rounded-lg bg-gray-50 text-sm"
                    >
                </div>
            </div>

            <!-- Due Date Range -->
            <div class="w-full">
                <label class="block text-sm font-medium text-gray-700 mb-1">Due Date Range</label>
                <div class="flex items-center gap-2">
                    <input 
                        type="date" 
                        id="due-date-start"
                        bind:value={dueDateRange.start}
                        on:change={validateDateRanges}
                        class="flex-1 px-3 py-2 border rounded-lg bg-gray-50 text-sm"
                    >
                    <span class="text-gray-400">to</span>
                    <input 
                        type="date" 
                        id="due-date-end"
                        bind:value={dueDateRange.end}
                        on:change={validateDateRanges}
                        class="flex-1 px-3 py-2 border rounded-lg bg-gray-50 text-sm"
                    >
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

    <!-- Orders Table Card -->
    <div class="bg-white p-6 rounded-lg shadow-md">
        <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold">Order Details</h2>
            <div class="flex gap-2">
                <input 
                    type="text"
                    bind:value={searchQuery}
                    placeholder="Search across all fields..."
                    class="px-4 py-2 border rounded-lg"
                />
            </div>
        </div>

        <div class="overflow-x-auto">
            <table class="w-full">
                <thead>
                    <tr class="bg-gray-50">
                        <th class="p-3 text-left font-semibold cursor-pointer hover:bg-gray-100"
                            on:click={() => toggleSort('created_at')}>
                            Order Date {getSortIcon('created_at')}
                        </th>
                        <th class="p-3 text-left font-semibold cursor-pointer hover:bg-gray-100"
                            on:click={() => toggleSort('due_date')}>
                            Due Date {getSortIcon('due_date')}
                        </th>
                        <th class="p-3 text-left font-semibold cursor-pointer hover:bg-gray-100"
                            on:click={() => toggleSort('student')}>
                            Student Details {getSortIcon('student')}
                        </th>
                        <th class="p-3 text-left font-semibold cursor-pointer hover:bg-gray-100"
                            on:click={() => toggleSort('employee')}>
                            Assigned Tailor {getSortIcon('employee')}
                        </th>
                        <th class="p-3 text-left font-semibold">Order Status</th>
                    </tr>
                </thead>
                <tbody>
                    {#each filteredOrders as order}
                        {@const workInfo = calculateWorkDuration(order)}
                        <tr class="border-b hover:bg-gray-50">
                            <td class="p-3">
                                <div class="font-medium">{formatDate(order.created_at)}</div>
                            </td>
                            <td class="p-3">
                                <div class="font-medium">{formatDate(order.due_date)}</div>
                            </td>
                            <td class="p-3">
                                <div class="space-y-1">
                                    <div class="font-medium">
                                        {formatName(order.student?.first_name, order.student?.last_name)}
                                    </div>
                                    <div class="text-xs text-gray-500">
                                        {order.student?.course?.course_code || 'No course'}
                                    </div>
                                </div>
                            </td>
                            <td class="p-3">
                                {#if order.employee}
                                    <div class="font-medium">
                                        {formatName(order.employee.first_name, order.employee.last_name)}
                                    </div>
                                {:else}
                                    <div class="text-gray-500">Unassigned</div>
                                {/if}
                            </td>
                            <td class="p-3">
                                {#if order}
                                    {@const status = getStatusDetails(order)}
                                    <div class="space-y-1">
                                        <span class={`px-2 py-1 text-xs font-medium rounded-full
                                            ${status.mainStatus === 'completed' ? 'bg-green-100 text-green-800' :
                                            status.mainStatus === 'in progress' ? 'bg-blue-100 text-blue-800' :
                                            'bg-gray-100 text-gray-800'}`}>
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

    <!-- Metrics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-gray-50 p-6 rounded-lg border border-gray-100">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">Performance Overview</h3>
            <div class="space-y-3">
                <div class="flex justify-between items-center">
                    <span class="text-gray-600">Total Orders</span>
                    <span class="font-semibold text-gray-800">{metrics.totalOrders}</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-gray-600">Completed</span>
                    <span class="font-semibold text-green-600">{metrics.completedOrders}</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-gray-600">Pending</span>
                    <span class="font-semibold text-orange-600">{metrics.pendingOrders}</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-gray-600">In Progress</span>
                    <span class="font-semibold text-blue-600">{metrics.inProgressOrders}</span>
                </div>
            </div>
        </div>

        <div class="bg-gray-50 p-6 rounded-lg border border-gray-100">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">Efficiency Metrics</h3>
            <div class="space-y-3">
                <div class="flex justify-between items-center">
                    <span class="text-gray-600">Efficiency Rate</span>
                    <span class="font-semibold text-primary">{metrics.efficiencyRate}%</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-gray-600">Late Orders</span>
                    <span class="font-semibold text-red-600">{metrics.lateOrders}</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-gray-600">Avg. Completion Time</span>
                    <span class="font-semibold text-gray-800">{metrics.averageCompletionTime} days</span>
                </div>
            </div>
        </div>

        <!-- Updated Daily Workload card with scrolling -->
        <div class="bg-gray-50 p-6 rounded-lg border border-gray-100">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">Daily Workload</h3>
            <div class="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                {#each Object.entries(metrics.ordersByDay || {}).sort((a, b) => b[0].localeCompare(a[0])) as [date, count]}
                    <div class="flex justify-between items-center">
                        <span class="text-gray-600">{formatDate(date)}</span>
                        <span class="font-semibold text-gray-800">{count} orders</span>
                    </div>
                {/each}
            </div>
        </div>
    </div>
</div>
