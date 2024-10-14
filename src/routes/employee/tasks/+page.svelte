<script>
    // Example tasks data
    let tasks = [
      { id: 1, title: 'Finish Job Order #101', priority: 'High', status: 'In Progress', deadline: '2024-10-15' },
      { id: 2, title: 'Cut Fabric for Job Order #102', priority: 'Medium', status: 'Completed', deadline: '2024-10-18' },
    ];
  
    let filters = { status: '', priority: '' };
  
    function filterTasks() {
      return tasks.filter(task => {
        return (filters.status === '' || task.status === filters.status) && 
               (filters.priority === '' || task.priority === filters.priority);
      });
    }
  </script>
  
  <div class="space-y-6">
    <h2 class="text-2xl font-semibold mb-4">Task Management</h2>
  
    <!-- Filters -->
    <div class="space-y-4">
      <div>
        <label>Status:</label>
        <select bind:value={filters.status} class="border p-2">
          <option value="">All</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
      </div>
      <div>
        <label>Priority:</label>
        <select bind:value={filters.priority} class="border p-2">
          <option value="">All</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
        </select>
      </div>
    </div>
  
    <!-- Task List -->
    <div class="space-y-4">
      {#each filterTasks() as task}
        <div class="border rounded p-4">
          <h3 class="text-lg font-bold">{task.title}</h3>
          <p>Status: {task.status}</p>
          <p>Priority: {task.priority}</p>
          <p>Deadline: {task.deadline}</p>
        </div>
      {/each}
    </div>
  </div>
  