<script>
  import { createEventDispatcher } from "svelte";

  export let students = [];
  export let searchTerm = "";

  const dispatch = createEventDispatcher();

  $: filteredStudents = students.filter((student) =>
    `${student.first_name} ${student.last_name} ${student.course?.course_code}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  function selectStudent(student) {
    dispatch("select", { student });
  }

  function closeModal() {
    dispatch("close");
  }
</script>

<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[51]">
  <div class="bg-white p-6 rounded-lg w-[500px] max-h-[80vh] flex flex-col">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold">Search Student</h2>
      <button
        class="text-gray-500 hover:text-gray-700"
        on:click={closeModal}
      >
        &times;
      </button>
    </div>

    <!-- Search input -->
    <div class="mb-4">
      <div class="relative">
        <input
          type="text"
          bind:value={searchTerm}
          placeholder="Search by name or course..."
          class="w-full p-2 pr-8 border rounded"
        />
      </div>
    </div>

    <!-- Results list -->
    <div class="flex-1 overflow-y-auto">
      {#if filteredStudents.length === 0}
        <p class="text-center text-gray-500 py-4">No students found</p>
      {:else}
        <div class="divide-y">
          {#each filteredStudents as student}
            <div
              class="p-3 hover:bg-gray-50 cursor-pointer flex items-center space-x-4"
              on:click={() => selectStudent(student)}
            >
              <div class="flex-1">
                <div class="font-semibold">
                  {student.first_name}
                  {student.last_name}
                </div>
                <div class="text-sm text-gray-600">
                  <span class="inline-block bg-gray-100 px-2 py-0.5 rounded">
                    {student.course?.course_code}
                  </span>
                  <span class="ml-2 capitalize">{student.gender}</span>
                </div>
              </div>
              <div class="text-gray-400">→</div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <div class="mt-4 pt-4 border-t text-sm text-gray-500">
      {filteredStudents.length} student{filteredStudents.length !== 1 ? "s" : ""} found
    </div>
  </div>
</div>
