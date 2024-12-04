<script>
    export let data;
    import { enhance } from '$app/forms';
    import { invalidateAll } from '$app/navigation';

    let searchTerm = '';
    let sortBy = 'dueDate'; // 'studentName', 'dueDate', 'amount'
    let sortOrder = 'asc';
    let activeTab = 'urgent';
    let showMeasurements = false;
    let selectedOrder = null;
    let startDate = '';
    let endDate = '';

    function filterOrders(orders, searchTerm) {
        if (!searchTerm.trim()) return orders;
        
        const terms = searchTerm.toLowerCase().trim().split(/\s+/);
        
        return orders.filter(order => {
            const searchableText = `
                ${order.studentName.toLowerCase()}
                ${order.course.toLowerCase()}
                ${order.id}
            `;
            
            return terms.every(term => searchableText.includes(term));
        });
    }

    function filterByDateRange(orders, startDate, endDate) {
        if (!startDate || !endDate) return orders;
        const start = new Date(startDate);
        const end = new Date(endDate);
        return orders.filter(order => {
            const orderDate = new Date(order.dueDate);
            return orderDate >= start && orderDate <= end;
        });
    }

    function clearDateRange() {
        startDate = '';
        endDate = '';
    }

    function getDueLabel(daysUntilDue) {
        if (daysUntilDue < 0) return 'Overdue';
        if (daysUntilDue === 0) return 'Due today';
        if (daysUntilDue === 1) return 'Due tomorrow';
        return `Due in ${daysUntilDue} days`;
    }

    function getCompletionLabel(order) {
        return order.completedInTime ? 'Completed in Time' : 'Completed Late';
    }

    function getOrderLabel(order) {
        if (order.uniformType === 'both') return 'Full Uniform';
        return order.uniformType === 'upper' ? 'Upper Wear' : 'Lower Wear';
    }

    function getMeasurementsByType(measurements, uniformConfigs) {
        const upper = [];
        const lower = [];

        Object.entries(measurements).forEach(([measurementId, value]) => {
            const measurementType = data.measurementTypes.find(m => m.id === parseInt(measurementId));
            if (!measurementType) return;

            const measurementInfo = {
                name: measurementType.name,
                value: value,
                unit: 'cm'
            };

            // Check if measurement is used in upper or lower wear
            uniformConfigs.forEach(config => {
                const specs = config.measurement_specs;
                const isUsed = specs.some(spec => spec.measurement_type_id === parseInt(measurementId));
                if (isUsed) {
                    if (config.wear_type === 'upper') upper.push(measurementInfo);
                    else if (config.wear_type === 'lower') lower.push(measurementInfo);
                }
            });
        });

        return { upper, lower };
    }

    $: filteredUrgentOrders = filterOrders(data.urgentOrders, searchTerm);
    $: filteredInProgressOrders = filterOrders(data.inProgressOrders, searchTerm);
    $: filteredCompletedOrders = filterOrders(data.completedOrders, searchTerm);

    $: sortedOrders = (orders) => {
        if (!orders) return [];
        return [...orders].sort((a, b) => {
            switch(sortBy) {
                case 'studentName':
                    return sortOrder === 'asc' 
                        ? a.studentName.localeCompare(b.studentName)
                        : b.studentName.localeCompare(a.studentName);
                case 'dueDate':
                    return sortOrder === 'asc' 
                        ? new Date(a.dueDate) - new Date(b.dueDate)
                        : new Date(b.dueDate) - new Date(a.dueDate);
                case 'amount':
                    return sortOrder === 'asc' 
                        ? a.totalAmount - b.totalAmount
                        : b.totalAmount - a.totalAmount;
                default:
                    return 0;
            }
        });
    };

    $: ordersToDisplay = activeTab === 'urgent' ? filteredUrgentOrders :
                        activeTab === 'inProgress' ? filteredInProgressOrders :
                        filteredCompletedOrders;

    $: dateFilteredOrders = filterByDateRange(ordersToDisplay, startDate, endDate);
    $: displayedOrders = sortedOrders(dateFilteredOrders);

    const handleComplete = async () => {
        return async ({ result }) => {
            if (result.type === 'success') {
                window.location.reload();
            } else if (result.type === 'failure') {
                showError(result.error || 'Failed to create course');
            }
        };
    }
</script>

<div class="p-6 max-w-7xl mx-auto">
    <div class="bg-white rounded-lg shadow-md">
        <!-- Header with filters -->
        <div class="border-b p-4 md:p-6 space-y-4 md:space-y-6">
            <div class="flex justify-between items-center">
                <h1 class="text-xl md:text-2xl font-bold text-foreground">My Orders</h1>
            </div>
            
            <!-- Search and filters in a grid -->
            <div class="flex flex-col space-y-3 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4">
                <input
                    type="text"
                    placeholder="Search student name or course..."
                    bind:value={searchTerm}
                    class="px-3 md:px-4 py-2 border rounded-lg bg-white w-full text-sm md:text-base"
                />
                
                <div class="flex gap-2">
                    <select bind:value={sortBy} class="border rounded-lg p-2 flex-1 text-sm md:text-base">
                        <option value="dueDate">Sort by Due Date</option>
                        <option value="studentName">Sort by Name</option>
                        <option value="amount">Sort by Amount</option>
                    </select>
                    
                    <select bind:value={sortOrder} class="border rounded-lg p-2 w-24 md:w-32 text-sm md:text-base">
                        <option value="asc">Ascending</option>
                        <option value="desc">Descending</option>
                    </select>
                </div>

                <div class="flex gap-2 items-center">
                    <div class="flex gap-2 flex-1">
                        <input 
                            type="date" 
                            bind:value={startDate}
                            class="border rounded-lg p-2 flex-1 text-sm md:text-base"
                            max={endDate || undefined}
                        />
                        <input 
                            type="date" 
                            bind:value={endDate}
                            class="border rounded-lg p-2 flex-1 text-sm md:text-base"
                            min={startDate || undefined}
                        />
                    </div>
                    {#if startDate || endDate}
                        <button 
                            class="px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            on:click={clearDateRange}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                            </svg>
                        </button>
                    {/if}
                </div>
            </div>

            <!-- Tabs with better mobile styling -->
            <div class="flex flex-wrap gap-2 md:gap-4">
                <button 
                    class="px-3 md:px-6 py-2 rounded-lg transition-colors text-sm md:text-base {activeTab === 'urgent' ? 'bg-red-100 text-red-800 font-semibold' : 'hover:bg-gray-100'}"
                    on:click={() => activeTab = 'urgent'}
                >
                    Urgent ({filteredUrgentOrders.length})
                </button>
                <button 
                    class="px-6 py-2 rounded-lg transition-colors {activeTab === 'inProgress' ? 'bg-blue-100 text-blue-800 font-semibold' : 'hover:bg-gray-100'}"
                    on:click={() => activeTab = 'inProgress'}
                >
                    In Progress ({filteredInProgressOrders.length})
                </button>
                <button 
                    class="px-6 py-2 rounded-lg transition-colors {activeTab === 'completed' ? 'bg-green-100 text-green-800 font-semibold' : 'hover:bg-gray-100'}"
                    on:click={() => activeTab = 'completed'}
                >
                    Completed ({filteredCompletedOrders.length})
                </button>
            </div>
        </div>

        <!-- Orders Grid with improved mobile design -->
        <div class="p-4 md:p-6">
            <div class="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {#each displayedOrders as order}
                    <div class="border rounded-lg p-4 md:p-6 hover:shadow-lg transition-shadow bg-gray-50">
                        <!-- Order header -->
                        <div class="flex justify-between items-start mb-3">
                            <div>
                                <h3 class="font-semibold text-sm md:text-base truncate max-w-[160px] md:max-w-[200px]">{order.studentName}</h3>
                                <p class="text-xs text-gray-600">{order.course}</p>
                            </div>
                            <span class="px-2 py-1 text-xs {activeTab === 'urgent' ? 'bg-red-100 text-red-800' :
                                                    activeTab === 'inProgress' ? 'bg-blue-100 text-blue-800' : 
                                                    order.completedInTime ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'} rounded-full font-medium">
                                {#if activeTab === 'completed'}
                                    {getCompletionLabel(order)}
                                {:else}
                                    {getDueLabel(order.daysUntilDue)}
                                {/if}
                            </span>
                        </div>

                        <!-- Order details -->
                        <div class="space-y-2 text-xs border-t border-b py-3 my-3">
                            <p class="flex justify-between">
                                <span class="text-gray-600">Order ID:</span>
                                <span class="font-medium">#{order.id}</span>
                            </p>
                            <p class="flex justify-between">
                                <span class="text-gray-600">Type:</span>
                                <span class="font-medium">{getOrderLabel(order)}</span>
                            </p>
                            <p class="flex justify-between">
                                <span class="text-gray-600">Due Date:</span>
                                <span class="font-medium">{new Date(order.dueDate).toLocaleDateString()}</span>
                            </p>
                            {#if order.completed_at}
                                <p class="flex justify-between">
                                    <span class="text-gray-600">Completed:</span>
                                    <span class="font-medium">{new Date(order.completed_at).toLocaleDateString()}</span>
                                </p>
                            {/if}
                            <p class="flex justify-between">
                                <span class="text-gray-600">Amount:</span>
                                <span class="font-medium">₱{order.totalAmount}</span>
                            </p>
                            <p class="flex justify-between">
                                <span class="text-gray-600">Payment:</span>
                                <span class="font-medium">{order.paymentStatus}</span>
                            </p>
                        </div>

                        <!-- Measurements button -->
                        <div class="mt-4 mb-3">
                            <button 
                                class="w-full px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                                on:click={() => {
                                    selectedOrder = order;
                                    showMeasurements = true;
                                }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                    <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd" />
                                </svg>
                                View Measurements
                            </button>
                        </div>

                        <!-- Action buttons -->
                        {#if activeTab !== 'completed'}
                            <form 
                                method="POST" 
                                action="?/updateStatus"
                                use:enhance={handleComplete}
                            >
                                <input type="hidden" name="orderId" value={order.id} />
                                <button 
                                    type="submit"
                                    class="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    Mark as Completed
                                </button>
                            </form>
                        {/if}
                    </div>
                {/each}
            </div>
        </div>
    </div>
</div>

<!-- Measurements Modal -->
{#if showMeasurements && selectedOrder}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 md:p-4 z-50">
        <div class="bg-white rounded-lg p-4 md:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div class="flex justify-between items-start md:items-center mb-4 md:mb-6">
                <div>
                    <h3 class="text-lg md:text-xl font-bold">{selectedOrder.studentName}</h3>
                    <p class="text-xs md:text-sm text-gray-600">
                        {selectedOrder.gender.charAt(0).toUpperCase() + selectedOrder.gender.slice(1).toLowerCase()} - {selectedOrder.course.toUpperCase()}
                    </p>
                </div>
                <button 
                    class="p-2 hover:bg-gray-100 rounded-full text-gray-500"
                    on:click={() => showMeasurements = false}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {#if selectedOrder.uniformType === 'upper' || selectedOrder.uniformType === 'both'}
                <div class="mb-4 md:mb-6">
                    <h4 class="font-semibold text-base md:text-lg mb-2 md:mb-3 text-blue-800">Upper Wear Measurements</h4>
                    <div class="bg-gray-50 rounded-lg p-3 md:p-4 space-y-2 md:space-y-3">
                        {#each Object.entries(selectedOrder.order_measurements || {}) as [measurementId, value]}
                            {#if selectedOrder.uniformConfigs.some(c => 
                                c.wear_type === 'upper' && 
                                c.measurement_specs.some(s => s.measurement_type_id === parseInt(measurementId))
                            )}
                                {@const measurementType = data.measurementTypes.find(m => m.id === parseInt(measurementId))}
                                {#if measurementType}
                                    <div class="flex justify-between items-center border-b border-gray-200 pb-2">
                                        <span class="capitalize text-gray-700">{measurementType.name}</span>
                                        <span class="font-medium bg-white px-3 py-1 rounded-full border">{value} cm</span>
                                    </div>
                                {/if}
                            {/if}
                        {/each}
                    </div>
                </div>
            {/if}

            {#if selectedOrder.uniformType === 'lower' || selectedOrder.uniformType === 'both'}
                <div>
                    <h4 class="font-semibold text-base md:text-lg mb-2 md:mb-3 text-blue-800">Lower Wear Measurements</h4>
                    <div class="bg-gray-50 rounded-lg p-3 md:p-4 space-y-2 md:space-y-3">
                        {#each Object.entries(selectedOrder.order_measurements || {}) as [measurementId, value]}
                            {#if selectedOrder.uniformConfigs.some(c => 
                                c.wear_type === 'lower' && 
                                c.measurement_specs.some(s => s.measurement_type_id === parseInt(measurementId))
                            )}
                                {@const measurementType = data.measurementTypes.find(m => m.id === parseInt(measurementId))}
                                {#if measurementType}
                                    <div class="flex justify-between items-center border-b border-gray-200 pb-2">
                                        <span class="capitalize text-gray-700">{measurementType.name}</span>
                                        <span class="font-medium bg-white px-3 py-1 rounded-full border">{value} cm</span>
                                    </div>
                                {/if}
                            {/if}
                        {/each}
                    </div>
                </div>
            {/if}
        </div>
    </div>
{/if}