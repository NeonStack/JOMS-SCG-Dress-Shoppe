<script>
  import { onMount, onDestroy } from 'svelte';
  import Chart from 'chart.js/auto';

  let chart1, chart2, chart3;

  onMount(() => {
      // Job Order Overview Chart
      const ctx1 = document.getElementById('jobOrderChart').getContext('2d');
      chart1 = new Chart(ctx1, {
          type: 'bar',
          data: {
              labels: ['Ongoing', 'Upcoming', 'Completed'],
              datasets: [{
                  label: 'Job Orders',
                  data: [15, 10, 25],
                  backgroundColor: ['#FF6B35', '#E85D2F', '#FFB599']
              }]
          },
          options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                  y: { beginAtZero: true }
              }
          }
      });

      // Task Progress Chart
      const ctx2 = document.getElementById('taskProgressChart').getContext('2d');
      chart2 = new Chart(ctx2, {
          type: 'doughnut',
          data: {
              labels: ['In Progress', 'Completed'],
              datasets: [{
                  label: 'Task Progress',
                  data: [60, 40],
                  backgroundColor: ['#FF6B35', '#FFB599']
              }]
          },
          options: {
              responsive: true,
              maintainAspectRatio: false,
          }
      });

      // Payment Summary Chart
      const ctx3 = document.getElementById('paymentSummaryChart').getContext('2d');
      chart3 = new Chart(ctx3, {
          type: 'line',
          data: {
              labels: ['January', 'February', 'March', 'April', 'May', 'June'],
              datasets: [{
                  label: 'Payments Received',
                  data: [5000, 7000, 4000, 8000, 9000, 12000],
                  backgroundColor: '#FF6B35',
                  borderColor: '#FF6B35',
                  fill: true
              }]
          },
          options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                  y: { beginAtZero: true }
              }
          }
      });
  });

  onDestroy(() => {
      if (chart1) chart1.destroy();
      if (chart2) chart2.destroy();
      if (chart3) chart3.destroy();
  });
</script>

<div class="p-6 bg-white rounded-lg shadow-md">
  <h1 class="text-2xl font-bold mb-6">Dashboard Overview</h1>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Job Order Overview -->
      <div class="mb-6 h-72">
          <h2 class="text-xl font-semibold mb-4">Job Order Overview</h2>
          <canvas id="jobOrderChart" class="h-full"></canvas>
      </div>

      <!-- Task Progress -->
      <div class="mb-6 h-72">
          <h2 class="text-xl font-semibold mb-4">Task Progress</h2>
          <canvas id="taskProgressChart" class="h-full"></canvas>
      </div>

      <!-- Payment Summary -->
      <div class="mb-6 h-72 md:col-span-2">
          <h2 class="text-xl font-semibold mb-4">Payment Summary</h2>
          <canvas id="paymentSummaryChart" class="h-full"></canvas>
      </div>
  </div>

  <!-- Buttons for Quick Actions -->
  <div class="flex gap-4 mt-6">
      <button class="bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded">Add Job Order</button>
      <button class="bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded">Assign Task</button>
      <button class="bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded">Add Payment</button>
      <button class="bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded">View Reports</button>
  </div>
</div>

<style>
  /* Custom Styling */
  h2 {
      color: #FF6B35;
  }
</style>
