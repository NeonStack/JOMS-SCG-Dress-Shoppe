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
  
  <h1 class="text-2xl font-bold mb-4">Dashboard</h1>
  
  <!-- Task Overview Section -->
  <div class="mb-6">
    <h2 class="text-xl font-semibold mb-2">Assigned Tasks</h2>
    <ul class="bg-white p-4 rounded-lg shadow">
      {#each tasks as task}
        <li class="py-2">
          <span class="font-semibold">{task.name}</span> - {task.status} 
          <span class="text-sm text-gray-500">({task.deadline})</span> - <span class="text-sm text-red-500">{task.priority}</span>
        </li>
      {/each}
    </ul>
  </div>
  
  <!-- Upcoming Deadlines Section -->
  <div class="mb-6">
    <h2 class="text-xl font-semibold mb-2">Upcoming Job Orders</h2>
    <ul class="bg-white p-4 rounded-lg shadow">
      {#each upcomingJobs as job}
        <li class="py-2">
          <span class="font-semibold">{job.orderName}</span> - <span class="text-sm text-gray-500">{job.deadline}</span>
        </li>
      {/each}
    </ul>
  </div>
  