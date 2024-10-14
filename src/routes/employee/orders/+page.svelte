<script>
    // Example job orders
    let jobOrders = [
      { id: 1, title: 'Job Order #101', dueDate: '2024-10-15', measurements: 'Chest: 38", Waist: 32"', fabric: '5 yards', status: 'In Progress' },
      { id: 2, title: 'Job Order #102', dueDate: '2024-10-18', measurements: 'Chest: 40", Waist: 34"', fabric: '6 yards', status: 'Completed' },
    ];
  </script>
  
  <div class="space-y-6">
    <h2 class="text-2xl font-semibold mb-4">Job Orders</h2>
  
    <!-- Job Order List -->
    <div class="space-y-4">
      {#each jobOrders as job}
        <div class="border rounded p-4">
          <h3 class="text-lg font-bold">{job.title}</h3>
          <p>Due Date: {job.dueDate}</p>
          <p>Measurements: {job.measurements}</p>
          <p>Fabric Required: {job.fabric}</p>
          <p>Status: {job.status}</p>
        </div>
      {/each}
    </div>
  </div>
  