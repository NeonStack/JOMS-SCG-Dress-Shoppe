<script>
  export let data;
  const { orders, stats, ordersByCourse } = data;

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  const today = new Date().toISOString().split("T")[0];
  const oneWeekFromNow = new Date();
  oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
  const oneWeekDate = oneWeekFromNow.toISOString().split("T")[0];

  const dueToday = orders.filter(
    (order) => order.due_date === today && order.status === "in progress"
  );
  const dueThisWeek = orders.filter(
    (order) =>
      order.due_date <= oneWeekDate &&
      order.due_date > today &&
      order.status === "in progress"
  );
  const inProgressOrders = orders.filter(
    (order) => order.status === "in progress"
  );

  const dueInSevenDays = orders.filter(
    order => order.due_date <= oneWeekDate && 
            order.due_date >= today && 
            order.status === 'in progress'
  ).sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

  // Calculate days until due date
  function getDaysUntilDue(dueDate) {
    const days = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (days < 0) {
      const overdueDays = Math.abs(days);
      return `Overdue by ${overdueDays} ${overdueDays === 1 ? 'day' : 'days'}`;
    }
    return days === 0 ? 'Due today' : days === 1 ? '1 day left' : `${days} days left`;
  }

  // Get urgency class based on days until due
  function getUrgencyClass(dueDate) {
    const days = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (days <= 0) return 'bg-red-100 text-red-800 border-red-200';
    if (days <= 2) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-blue-100 text-blue-800 border-blue-200';
  }

  // Add new helper function for completion status
  function getCompletionStatus(dueDate, updatedAt) {
    const completionDate = new Date(updatedAt);
    const dueDateTime = new Date(dueDate);
    return completionDate <= dueDateTime ? 'Completed in Time' : 'Completed Late';
  }

  // Get status class based on completion
  function getCompletionClass(dueDate, updatedAt) {
    return getCompletionStatus(dueDate, updatedAt) === 'Completed in Time' 
      ? 'bg-emerald-100 text-emerald-800' 
      : 'bg-orange-100 text-orange-800';
  }

  // Modal state
  let showModal = false;
  let modalTitle = '';
  let modalOrders = [];

  function openModal(title, filterFn) {
    modalTitle = title;
    modalOrders = orders.filter(filterFn).sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
    showModal = true;
  }

  function closeModal() {
    showModal = false;
  }
</script>

<!-- Modal Component -->
{#if showModal}
  <div class="absolute inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
    <div class="bg-white rounded-xl w-full max-w-4xl h-[85vh] flex flex-col">
      <div class="p-4 border-b flex justify-between items-center bg-white sticky top-0 z-10">
        <h2 class="text-xl font-semibold">{modalTitle}</h2>
        <button class="text-gray-500 hover:text-gray-700" on:click={closeModal}>×</button>
      </div>
      <div class="flex-1 p-4 overflow-y-auto">
        {#if modalOrders.length === 0}
          <p class="text-center text-gray-500 py-8">No orders found</p>
        {:else}
          <div class="space-y-4">
            {#each modalOrders as order}
              <div class="p-4 rounded-lg border {order.status === 'completed' ? getCompletionClass(order.due_date, order.updated_at) : getUrgencyClass(order.due_date)}">
                <div class="flex justify-between items-start">
                  <div>
                    <div class="flex items-center gap-3">
                      <span class="font-semibold">#{order.id}</span>
                      <span class="text-xs">
                        {#if order.status === 'completed'}
                          {getCompletionStatus(order.due_date, order.updated_at)}
                        {:else}
                          {getDaysUntilDue(order.due_date)}
                        {/if}
                      </span>
                    </div>
                    <p class="text-sm mt-1">
                      {order.students.first_name} {order.students.last_name}
                      <span class="text-gray-500">• {order.students.course.course_code}</span>
                    </p>
                    <p class="text-xs mt-2">{order.uniform_type}</p>
                  </div>
                  <div class="text-sm">{formatDate(order.due_date)}</div>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<div class="max-w-7xl mx-auto px-4 py-6">
  <!-- Header -->
  <div class="flex justify-between items-center mb-8">
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

  <!-- Quick Stats -->
  <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
    <div 
      class="bg-purple-100 p-6 rounded-xl border-2 border-purple-200 cursor-pointer hover:bg-purple-50 transition-colors"
      on:click={() => openModal('Overdue Orders', o => o.due_date < today && o.status === 'in progress')}
    >
      <h3 class="text-sm font-medium text-purple-900 mb-1">Overdue</h3>
      <p class="text-2xl font-bold text-purple-800">{stats.overdue}</p>
      <p class="text-xs text-purple-700 mt-1">Past Due Date</p>
    </div>

    <div 
      class="bg-red-100 p-6 rounded-xl border-2 border-red-200 cursor-pointer hover:bg-red-50 transition-colors"
      on:click={() => openModal('Due Today', o => o.due_date === today && o.status === 'in progress')}
    >
      <h3 class="text-sm font-medium text-red-900 mb-1">Due Today</h3>
      <p class="text-2xl font-bold text-red-800">{stats.dueToday}</p>
      <p class="text-xs text-red-700 mt-1">Critical Priority</p>
    </div>

    <div 
      class="bg-amber-100 p-6 rounded-xl border-2 border-amber-200 cursor-pointer hover:bg-amber-50 transition-colors"
      on:click={() => openModal('Due in 7 Days', o => o.due_date <= oneWeekDate && o.due_date >= today && o.status === 'in progress')}
    >
      <h3 class="text-sm font-medium text-amber-900 mb-1">Due in 7 Days</h3>
      <p class="text-2xl font-bold text-amber-800">{stats.dueInSevenDays}</p>
      <p class="text-xs text-amber-700 mt-1">High Priority</p>
    </div>

    <div 
      class="bg-blue-100 p-6 rounded-xl border-2 border-blue-200 cursor-pointer hover:bg-blue-50 transition-colors"
      on:click={() => openModal('In Progress Orders', o => o.status === 'in progress')}
    >
      <h3 class="text-sm font-medium text-blue-900 mb-1">In Progress</h3>
      <p class="text-2xl font-bold text-blue-800">{stats.total}</p>
      <p class="text-xs text-blue-700 mt-1">Active Orders</p>
    </div>

    <div 
      class="bg-emerald-100 p-6 rounded-xl border-2 border-emerald-200 cursor-pointer hover:bg-emerald-50 transition-colors"
      on:click={() => openModal('Completed Orders', o => o.status === 'completed' && o.updated_at.startsWith(new Date().toISOString().slice(0, 7)))}
    >
      <h3 class="text-sm font-medium text-emerald-900 mb-1">Completed</h3>
      <p class="text-2xl font-bold text-emerald-800">
        {stats.completedThisMonth}
      </p>
      <p class="text-xs text-emerald-700 mt-1">This Month</p>
    </div>
  </div>

  <!-- Orders by Course -->
  <div class="mb-8">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-semibold text-foreground">Orders by Course</h2>
      <a href="/employee/orders" class="text-primary hover:underline"
        >View All Orders →</a
      >
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each Object.entries(ordersByCourse) as [courseCode, courseOrders]}
        {#if courseOrders.some((order) => order.status === "in progress")}
          <div
            class="bg-white p-6 rounded-xl shadow-sm border-2 border-gray-200"
          >
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-semibold">{courseCode}</h3>
              <span class="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {courseOrders.filter((o) => o.status === "in progress").length} active
              </span>
            </div>
            <div class="space-y-3">
              {#each courseOrders.filter((order) => order.status === "in progress")
                .sort((a, b) => new Date(a.due_date) - new Date(b.due_date)) as order}
                <div class="p-3 rounded-lg border {getUrgencyClass(order.due_date)}">
                  <div class="flex justify-between items-start gap-4">
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="font-medium">#{order.id}</span>
                        <span class="text-xs">{getDaysUntilDue(order.due_date)}</span>
                      </div>
                      <p class="text-sm mt-1">{order.students.first_name} {order.students.last_name}</p>
                      <p class="text-xs mt-1 opacity-75">{order.uniform_type}</p>
                    </div>
                    <div class="text-xs whitespace-nowrap">
                      {formatDate(order.due_date)}
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      {/each}
    </div>
  </div>
</div>
