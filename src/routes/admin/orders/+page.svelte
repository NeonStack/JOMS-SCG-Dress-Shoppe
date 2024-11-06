<script>
    import { enhance } from '$app/forms';
    import { format } from 'date-fns';
    import { invalidate } from '$app/navigation';
    
    export let data;
    let showModal = false;
    let showCreateModal = false;
    let searchTerm = '';
    let selectedStudent = null;
    let selectedUniformType = 'upper';
    let selectedDueDate = '';
    let selectedOrders = [];
    let selectedEmployee = null;
    let dateRange = { start: '', end: '' };
    let sortField = 'due_date';
    let sortDirection = 'asc';
    let activeTab = 'pending'; // Add this for tab management
    let selectAll = false; // Add new state for select all
    let filteredResults = null; // Add new state for filtered orders

    $: filteredStudents = data.students.filter(student => 
        `${student.first_name} ${student.last_name} ${student.course?.course_code}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );

    $: totalAmount = calculateTotalAmount(selectedStudent, selectedUniformType);

    $: sortedOrders = [...(filteredResults || data.orders || [])].sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];
        const direction = sortDirection === 'asc' ? 1 : -1;
        return aVal > bVal ? direction : -direction;
    });

    // Add these computed properties for filtering orders by status
    $: pendingOrders = sortedOrders.filter(order => order.status === 'pending');
    $: inProgressOrders = sortedOrders.filter(order => order.status === 'in progress');
    $: completedOrders = sortedOrders.filter(order => order.status === 'completed');

    function calculateTotalAmount(student, uniformType) {
        if (!student || !uniformType) return 0;
        
        const configs = data.uniformConfigs.filter(
            c => c.course_id === student.course_id && c.gender === student.gender
        );
        
        if (!configs.length) return 0;

        if (uniformType === 'both') {
            const upperConfig = configs.find(c => c.wear_type === 'upper');
            const lowerConfig = configs.find(c => c.wear_type === 'lower');
            return (upperConfig?.base_price || 0) + (lowerConfig?.base_price || 0);
        } else {
            const config = configs.find(c => c.wear_type === uniformType);
            return config?.base_price || 0;
        }
    }

    function toggleSort(field) {
        if (sortField === field) {
            sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            sortField = field;
            sortDirection = 'asc';
        }
    }

    function selectStudent(student) {
        selectedStudent = student;
        showModal = false;
    }

    function resetForm() {
        selectedStudent = null;
        selectedUniformType = 'upper';
        selectedDueDate = '';
        showCreateModal = false;
        showModal = false; // Also close the student search modal
    }

    // Modify the toggleOrderSelection to handle individual selections
    function toggleOrderSelection(orderId) {
        selectedOrders = selectedOrders.includes(orderId)
            ? selectedOrders.filter(id => id !== orderId)
            : [...selectedOrders, orderId];
        // Update selectAll state
        selectAll = selectedOrders.length === pendingOrders.length;
    }

    // Add new function to handle select all
    function toggleSelectAll() {
        selectAll = !selectAll;
        selectedOrders = selectAll ? pendingOrders.map(order => order.id) : [];
    }

    // Add function to handle successful assignment
    function handleAssignmentSuccess() {
        selectedOrders = [];
        selectAll = false;
        selectedEmployee = null;
    }

    // Add this function for tab switching
    function switchTab(tab) {
        activeTab = tab;
        selectedOrders = []; // Clear selections when switching tabs
    }

    // Add function to handle filter reset
    function resetFilter() {
        dateRange.start = '';
        dateRange.end = '';
        filteredResults = null;
    }

    // Update the enhance function in the create order form
    const handleCreateOrder = () => {
        return async ({ result }) => {
            if (result.type === 'success') {
                resetForm();
                await invalidate('app:orders'); // Reload the data
            }
        };
    };

    // Update the enhance function in the assign orders form
    const handleAssignOrders = () => {
        return async ({ result }) => {
            if (result.type === 'success') {
                handleAssignmentSuccess();
                await invalidate('app:orders'); // Reload the data
            }
        };
    };

    // Update the enhance function in the filter orders form
    const handleFilterOrders = () => {
        return async ({ result }) => {
            if (result.type === 'success' && result.data.filteredOrders) {
                filteredResults = result.data.filteredOrders;
                await invalidate('app:orders'); // Reload the data
            }
        };
    };

    // Add this function for consistent sort icons
    function getSortIcon(field) {
        if (sortField !== field) return '↕';
        return sortDirection === 'asc' ? '↑' : '↓';
    }
</script>

<!-- Student Search Modal -->
{#if showModal}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[51]">
        <div class="bg-white p-6 rounded-lg w-1/2 max-h-[80vh] overflow-y-auto">
            <div class="flex justify-between mb-4">
                <h2 class="text-xl font-semibold">Select Student</h2>
                <button on:click={() => showModal = false} class="text-gray-500">&times;</button>
            </div>
            
            <input
                type="text"
                bind:value={searchTerm}
                placeholder="Search student..."
                class="w-full p-2 border rounded mb-4"
            >

            <div class="divide-y">
                {#each filteredStudents as student}
                    <div 
                        class="p-2 hover:bg-muted cursor-pointer"
                        on:click={() => selectStudent(student)}
                    >
                        <div class="font-semibold">{student.first_name} {student.last_name}</div>
                        <div class="text-sm text-gray-600">{student.course?.course_code}</div>
                    </div>
                {/each}
            </div>
        </div>
    </div>
{/if}

<!-- Create Order Modal -->
{#if showCreateModal}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white p-6 rounded-lg w-1/2">
            <div class="flex justify-between mb-4">
                <h2 class="text-xl font-semibold">Create New Order</h2>
                <button on:click={resetForm} class="text-gray-500">&times;</button>
            </div>

            <form 
                method="POST" 
                action="?/createOrder" 
                use:enhance={handleCreateOrder}
            >
                <div class="space-y-4">
                    <div>
                        <label class="block mb-2">Student</label>
                        <div class="flex gap-2">
                            <input 
                                type="text"
                                readonly
                                value={selectedStudent ? `${selectedStudent.first_name} ${selectedStudent.last_name}` : ''}
                                class="w-full p-2 border rounded bg-gray-50"
                            >
                            <button 
                                type="button"
                                on:click={() => showModal = true}
                                class="bg-secondary px-4 py-2 rounded text-white"
                            >
                                Search
                            </button>
                        </div>
                        <input type="hidden" name="studentId" value={selectedStudent?.id}>
                    </div>

                    <div>
                        <label class="block mb-2">Uniform Type</label>
                        <select 
                            name="uniformType" 
                            bind:value={selectedUniformType}
                            class="w-full p-2 border rounded"
                            required
                        >
                            <option value="upper">Upper Wear</option>
                            <option value="lower">Lower Wear</option>
                            <option value="both">Both</option>
                        </select>
                    </div>

                    <div>
                        <label class="block mb-2">Due Date</label>
                        <input 
                            type="date" 
                            name="dueDate"
                            bind:value={selectedDueDate}
                            class="w-full p-2 border rounded"
                            required
                        >
                    </div>

                    <div>
                        <label class="block mb-2">Total Amount</label>
                        <input 
                            type="number" 
                            name="totalAmount"
                            value={totalAmount}
                            class="w-full p-2 border rounded bg-gray-50"
                            readonly
                        >
                    </div>
                </div>

                <div class="mt-6 flex justify-end gap-2">
                    <button 
                        type="button"
                        on:click={resetForm}
                        class="px-4 py-2 border rounded"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit"
                        class="bg-primary text-white px-4 py-2 rounded"
                    >
                        Create Order
                    </button>
                </div>
            </form>
        </div>
    </div>
{/if}

<!-- Main content -->
<div class="p-6">
    <div class="flex justify-between mb-6">
        <h1 class="text-2xl font-bold text-foreground">Order Management</h1>
        <button 
            class="bg-primary text-white px-4 py-2 rounded-lg"
            on:click={() => showCreateModal = true}
        >
            Create New Order
        </button>
    </div>

    <div class="bg-white p-6 rounded-lg shadow-md">
        <!-- Add tab navigation -->
        <div class="flex gap-4 mb-6 border-b">
            <button 
                class="px-4 py-2 {activeTab === 'pending' ? 'border-b-2 border-primary font-semibold' : ''}"
                on:click={() => switchTab('pending')}
            >
                Pending Orders ({pendingOrders.length})
            </button>
            <button 
                class="px-4 py-2 {activeTab === 'in_progress' ? 'border-b-2 border-primary font-semibold' : ''}"
                on:click={() => switchTab('in_progress')}
            >
                In Progress ({inProgressOrders.length})
            </button>
            <button 
                class="px-4 py-2 {activeTab === 'completed' ? 'border-b-2 border-primary font-semibold' : ''}"
                on:click={() => switchTab('completed')}
            >
                Completed ({completedOrders.length})
            </button>
        </div>

        <!-- Replace the employee assignment form with this improved version -->
        {#if activeTab === 'pending'}
            <div class="flex items-center justify-between mb-4 bg-muted p-4 rounded-lg">
                <div class="flex items-center gap-4">
                    <label class="flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            checked={selectAll}
                            on:change={toggleSelectAll}
                            class="w-4 h-4"
                        >
                        <span>Select All Orders</span>
                    </label>
                    {#if selectedOrders.length > 0}
                        <span class="text-sm text-gray-600">
                            {selectedOrders.length} order{selectedOrders.length > 1 ? 's' : ''}
                        </span>
                    {/if}
                </div>
                
                {#if selectedOrders.length > 0}
                    <form 
                        method="POST" 
                        action="?/assignOrders" 
                        use:enhance={handleAssignOrders}
                        class="flex gap-4 items-center"
                    >
                        <select 
                            name="employeeId" 
                            bind:value={selectedEmployee}
                            class="p-2 border rounded min-w-[200px]"
                            required
                        >
                            <option value="">Assign to employee...</option>
                            {#each data.employees as employee}
                                <option value={employee.id}>
                                    {employee.first_name} {employee.last_name}
                                </option>
                            {/each}
                        </select>
                        <input type="hidden" name="orderIds" value={selectedOrders.join(',')}>
                        <button 
                            type="submit"
                            class="bg-accent text-white px-4 py-2 rounded hover:bg-accent-hover transition-colors"
                            disabled={!selectedEmployee}
                        >
                            Assign Orders
                        </button>
                    </form>
                {/if}
            </div>
        {/if}

        <div class="flex justify-between mb-4">
            <h2 class="text-xl font-semibold">Orders List</h2>
            
            <form 
                method="POST" 
                action="?/filterOrders" 
                use:enhance={handleFilterOrders} 
                class="flex gap-4"
            >
                <input 
                    type="date" 
                    name="startDate"
                    bind:value={dateRange.start}
                    class="border rounded p-2"
                >
                <input 
                    type="date" 
                    name="endDate"
                    bind:value={dateRange.end}
                    class="border rounded p-2"
                >
                <button 
                    type="submit"
                    class="bg-secondary text-white px-4 py-2 rounded"
                    disabled={!dateRange.start || !dateRange.end}
                >
                    Filter
                </button>
                {#if filteredResults}
                    <button 
                        type="button"
                        class="px-4 py-2 border rounded text-gray-600"
                        on:click={resetFilter}
                    >
                        Clear Filter
                    </button>
                {/if}
            </form>
        </div>

        <div class="overflow-x-auto">
            <table class="w-full">
                <thead>
                    <tr class="bg-muted">
                        {#if activeTab === 'pending'}
                            <th class="p-2 w-12">Select</th>
                        {/if}
                        {#each ['id', 'student', 'uniform_type', 'due_date', 'total_amount', 'status'] as field}
                            <th 
                                class="p-2 cursor-pointer hover:bg-gray-200"
                                on:click={() => toggleSort(field)}
                            >
                                {field.charAt(0).toUpperCase() + field.slice(1).replace('_', ' ')}
                                <span class="ml-1">{getSortIcon(field)}</span>
                            </th>
                        {/each}
                        <th class="p-2">Assigned To</th>
                    </tr>
                </thead>
                <tbody>
                    {#if activeTab === 'pending'}
                        {#each pendingOrders as order}
                            <tr class="border-b hover:bg-muted">
                                <td class="p-2">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedOrders.includes(order.id)}
                                        on:change={() => toggleOrderSelection(order.id)}
                                        class="w-4 h-4"
                                    >
                                </td>
                                <td class="p-2">{order.id}</td>
                                <td class="p-2">
                                    {order.student?.first_name} {order.student?.last_name}
                                </td>
                                <td class="p-2">{order.uniform_type}</td>
                                <td class="p-2">{format(new Date(order.due_date), 'MMM d, yyyy')}</td>
                                <td class="p-2">₱{order.total_amount}</td>
                                <td class="p-2">
                                    <span class={`px-2 py-1 rounded-full text-sm
                                        ${order.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                          order.status === 'in progress' ? 'bg-blue-100 text-blue-800' : 
                                          'bg-yellow-100 text-yellow-800'}`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td class="p-2">
                                    {#if order.employee}
                                        {order.employee.first_name} {order.employee.last_name}
                                    {:else}
                                        <span class="text-gray-400">Unassigned</span>
                                    {/if}
                                </td>
                            </tr>
                        {/each}
                    {:else if activeTab === 'in_progress'}
                        {#each inProgressOrders as order}
                            <tr class="border-b hover:bg-muted">
                                <td class="p-2">{order.id}</td>
                                <td class="p-2">
                                    {order.student?.first_name} {order.student?.last_name}
                                </td>
                                <td class="p-2">{order.uniform_type}</td>
                                <td class="p-2">{format(new Date(order.due_date), 'MMM d, yyyy')}</td>
                                <td class="p-2">₱{order.total_amount}</td>
                                <td class="p-2">
                                    <span class={`px-2 py-1 rounded-full text-sm
                                        ${order.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                          order.status === 'in progress' ? 'bg-blue-100 text-blue-800' : 
                                          'bg-yellow-100 text-yellow-800'}`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td class="p-2">
                                    {#if order.employee}
                                        {order.employee.first_name} {order.employee.last_name}
                                    {:else}
                                        <span class="text-gray-400">Unassigned</span>
                                    {/if}
                                </td>
                            </tr>
                        {/each}
                    {:else}
                        {#each completedOrders as order}
                            <tr class="border-b hover:bg-muted">
                                <td class="p-2">{order.id}</td>
                                <td class="p-2">
                                    {order.student?.first_name} {order.student?.last_name}
                                </td>
                                <td class="p-2">{order.uniform_type}</td>
                                <td class="p-2">{format(new Date(order.due_date), 'MMM d, yyyy')}</td>
                                <td class="p-2">₱{order.total_amount}</td>
                                <td class="p-2">
                                    <span class={`px-2 py-1 rounded-full text-sm
                                        ${order.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                          order.status === 'in progress' ? 'bg-blue-100 text-blue-800' : 
                                          'bg-yellow-100 text-yellow-800'}`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td class="p-2">
                                    {#if order.employee}
                                        {order.employee.first_name} {order.employee.last_name}
                                    {:else}
                                        <span class="text-gray-400">Unassigned</span>
                                    {/if}
                                </td>
                            </tr>
                        {/each}
                    {/if}
                </tbody>
            </table>
        </div>
    </div>
</div>
