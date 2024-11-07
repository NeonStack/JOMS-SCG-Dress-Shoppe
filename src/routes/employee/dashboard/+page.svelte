<script>
  let tasks = [
    { name: 'Task 1', status: 'In Progress', deadline: '2024-10-15', priority: 'High' },
    { name: 'Task 2', status: 'Not Started', deadline: '2024-10-20', priority: 'Low' }
  ];

  let upcomingJobs = [
    { orderName: 'Order 1', deadline: '2024-10-18' },
    { orderName: 'Order 2', deadline: '2024-10-22' }
  ];
</script>

<h1 class="text-2xl font-bold text-primary mb-4">Dashboard</h1>

<!-- Task Overview Section -->
<div class="mb-6">
<h2 class="text-xl font-semibold text-foreground mb-2">Assigned Tasks</h2>
<ul class="bg-background p-4 rounded-lg shadow border border-border">
  {#each tasks as task}
    <li class="py-2">
      <span class="font-semibold">{task.name}</span> - {task.status}
      <span class="text-sm text-secondary">({task.deadline})</span> - 
      <span class="text-sm text-primary">{task.priority}</span>
    </li>
  {/each}
</ul>
</div>

<!-- Upcoming Deadlines Section -->
<div class="mb-6">
<h2 class="text-xl font-semibold text-foreground mb-2">Upcoming Job Orders</h2>
<ul class="bg-background p-4 rounded-lg shadow border border-border">
  {#each upcomingJobs as job}
    <li class="py-2">
      <span class="font-semibold text-primary">{job.orderName}</span> - 
      <span class="text-sm text-secondary">{job.deadline}</span>
    </li>
  {/each}
</ul>
</div>