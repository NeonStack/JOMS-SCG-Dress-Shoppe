<script>
  // Example job orders
  let jobOrders = [
    { id: 1, title: 'Job Order #101', dueDate: '2024-10-15', measurements: 'Chest: 38", Waist: 32"', fabric: '5 yards', status: 'In Progress' },
    { id: 2, title: 'Job Order #102', dueDate: '2024-10-18', measurements: 'Chest: 40", Waist: 34"', fabric: '6 yards', status: 'Completed' },
  ];
</script>

<div class="space-y-6 bg-background p-6">
  <h2 class="text-2xl font-semibold text-foreground mb-4">Job Orders</h2>

  <!-- Job Order List -->
  <div class="space-y-4">
    {#each jobOrders as job}
      <div class="border border-border rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
        <h3 class="text-lg font-bold text-primary">{job.title}</h3>
        <p class="text-secondary">Due Date: {job.dueDate}</p>
        <p class="text-text">Measurements: {job.measurements}</p>
        <p class="text-text">Fabric Required: {job.fabric}</p>
        <p class="text-text">Status: 
          <span class={`font-semibold ${job.status === 'In Progress' ? 'text-accent' : 'text-secondary'}`}>
            {job.status}
          </span>
        </p>
      </div>
    {/each}
  </div>
</div>