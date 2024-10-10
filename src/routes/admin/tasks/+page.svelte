<script>
    let tasks = [
      { id: 1, name: 'Cut Fabric', employee: 'Alice', status: 'In Progress', deadline: '2024-10-10' },
      { id: 2, name: 'Sew Pants', employee: 'Bob', status: 'Completed', deadline: '2024-10-05' }
    ];
  
    function createTask() {
      // Logic for creating a new task
    }
  </script>
  
  <div class="space-y-8">
    <!-- Task List -->
    <div class="bg-primary-light p-4 rounded-lg shadow">
      <h2 class="text-2xl font-bold mb-2">Task List</h2>
      <ul>
        {#each tasks as task}
          <li>
            {task.name} - {task.employee}, {task.status} (Due: {task.deadline})
            <button class="ml-4 text-sm bg-primary-dark text-white px-2 py-1 rounded">Edit</button>
          </li>
        {/each}
      </ul>
    </div>
  
    <!-- Create New Task -->
    <div class="bg-primary-light p-4 rounded-lg shadow">
      <h2 class="text-2xl font-bold mb-2">Create New Task</h2>
      <form on:submit|preventDefault={createTask}>
        <input type="text" placeholder="Task Name" class="w-full p-2 mb-2 border rounded" />
        <input type="text" placeholder="Assign to (Employee)" class="w-full p-2 mb-2 border rounded" />
        <select class="w-full p-2 mb-2 border rounded">
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
        <input type="date" placeholder="Deadline" class="w-full p-2 mb-2 border rounded" />
        <button type="submit" class="p-2 bg-primary-dark text-white rounded">Create Task</button>
      </form>
    </div>
  </div>
  