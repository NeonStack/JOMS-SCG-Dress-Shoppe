<script>
  import { onMount, onDestroy } from "svelte";
  import { browser } from "$app/environment";

  let jobOrders = [
    { id: 1, status: "In Progress", count: 5 },
    { id: 2, status: "Completed", count: 12 },
  ];

  let tasks = [
    { status: "In Progress", count: 8 },
    { status: "Completed", count: 15 },
  ];

  let payments = {
    received: 5000,
    due: 1000,
    overdue: 500,
  };

  let revenueData = [1000, 2000, 1500, 3000, 4000];
  let productivityData = [70, 60, 80, 90];

  // Initialize chart as null
  let chart = null;

  onMount(() => {
    if (browser) {
      const ctx = document.getElementById("revenueChart");
      if (ctx) {
        try {
          chart = new Chart(ctx, {
            type: "line",
            data: {
              labels: ["January", "February", "March", "April", "May"],
              datasets: [
                {
                  label: "Monthly Revenue",
                  data: revenueData,
                  backgroundColor: "rgba(255, 107, 53, 0.5)",
                  borderColor: "#FF6B35",
                  borderWidth: 2,
                },
              ],
            },
            options: {
              responsive: true,
            },
          });
        } catch (error) {
          console.error("Failed to create chart:", error);
        }
      }
    }
  });

  onDestroy(() => {
    try {
      if (chart) {
        chart.destroy();
      }
    } catch (error) {
      console.error("Failed to destroy chart:", error);
    }
  });
</script>

<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
  <!-- Job Order Overview -->
  <div class="bg-primary-light p-4 rounded-lg shadow">
    <h2 class="text-2xl font-bold mb-2">Job Order Overview</h2>
    <ul>
      {#each jobOrders as order}
        <li>{order.status}: {order.count}</li>
      {/each}
    </ul>
  </div>

  <!-- Task Progress -->
  <div class="bg-primary-light p-4 rounded-lg shadow">
    <h2 class="text-2xl font-bold mb-2">Task Progress</h2>
    <ul>
      {#each tasks as task}
        <li>{task.status}: {task.count}</li>
      {/each}
    </ul>
  </div>

  <!-- Payment Summary -->
  <div class="bg-primary-light p-4 rounded-lg shadow">
    <h2 class="text-2xl font-bold mb-2">Payment Summary</h2>
    <ul>
      <li>Received: ${payments.received}</li>
      <li>Due: ${payments.due}</li>
      <li>Overdue: ${payments.overdue}</li>
    </ul>
  </div>

  <!-- Revenue Chart -->
  <div class="bg-primary-light p-4 rounded-lg shadow">
    <h2 class="text-2xl font-bold mb-2">Monthly Revenue</h2>
    <canvas id="revenueChart"></canvas>
  </div>
</div>
