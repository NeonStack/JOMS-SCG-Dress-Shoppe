<script>
    // Example employee data
    let employee = {
      name: 'John Doe',
      contact: 'johndoe@example.com',
      tasksCompleted: 50,
      jobOrdersCompleted: 10,
    };
  
    function changePassword() {
      alert('Change Password functionality to be implemented.');
    }
  </script>
  
  <div class="space-y-6">
    <h2 class="text-2xl font-semibold mb-4">Profile</h2>
  
    <div class="border rounded p-4">
      <p><strong>Name:</strong> {employee.name}</p>
      <p><strong>Contact:</strong> {employee.contact}</p>
      <p><strong>Tasks Completed:</strong> {employee.tasksCompleted}</p>
      <p><strong>Job Orders Completed:</strong> {employee.jobOrdersCompleted}</p>
    </div>
  
    <button class="bg-primary text-white py-2 px-4 rounded mt-4" on:click={changePassword}>Change Password</button>
  </div>
  