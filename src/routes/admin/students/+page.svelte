<!-- +page.svelte -->
<script>
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabaseClient";

  // State Management
  let students = [];
  let courses = [];
  let measurements = [];
  let isRegistering = false;
  let isEditing = false;
  let editingStudent = null;
  let searchQuery = "";
  let selectedCourse = "";
  let selectedGender = "";
  let filteredStudents = [];

  // Form Data - Initialize with default values function
  const getDefaultFormData = () => ({
    first_name: "",
    last_name: "",
    course_id: "",
    year_level: 1,
    gender: "",
    contact_number: "",
    measurements: {},
  });

  let formData = getDefaultFormData();

  // Filters
  let filters = {
    course: "",
    yearLevel: "",
    gender: "",
  };

  onMount(async () => {
    await Promise.all([loadStudents(), loadCourses()]);
  });

  // Load students with their measurements
  async function loadStudents() {
    const { data, error } = await supabase
      .from("students")
      .select(`
        *,
        student_measurements (
          measurement_type_id,
          value,
          measurement_types (
            id,
            name
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error loading students:", error);
      return;
    }

    students = data;
    updateFilteredStudents();
  }

  // Load available courses
  async function loadCourses() {
    const { data, error } = await supabase.from("courses").select("*");

    if (error) {
      console.error("Error loading courses:", error);
      return;
    }

    courses = data;
  }

  // Load measurement types based on course and gender
  async function loadMeasurementTypes() {
    if (!selectedCourse || !selectedGender) {
      measurements = [];
      return;
    }

    const { data, error } = await supabase
      .from("uniform_configs")
      .select(
        `
          id,
          wear_type,
          config_required_measurements (
            measurement_types (
              id,
              name
            )
          )
        `
      )
      .eq("course_id", selectedCourse)
      .eq("gender", selectedGender);

    if (error) {
      console.error("Error loading measurement types:", error);
      return;
    }

    // Transform data to group by wear_type
    measurements = data.reduce((acc, config) => {
      if (!acc[config.wear_type]) acc[config.wear_type] = [];
      config.config_required_measurements.forEach((m) => {
        acc[config.wear_type].push({
          id: m.measurement_types.id,
          name: m.measurement_types.name,
        });
      });
      return acc;
    }, {});

    // Initialize measurements if not editing
    if (!isEditing) {
      const newMeasurements = {};
      Object.values(measurements)
        .flat()
        .forEach((m) => {
          newMeasurements[m.id] = "";
        });
      formData.measurements = newMeasurements;
    }
  }

  // Handle form submission with separated concerns
  async function handleSubmit() {
    try {
      if (isEditing && editingStudent) {
        await handleUpdate();
      } else {
        await handleCreate();
      }
      
      await loadStudents();
      resetForm();
    } catch (error) {
      console.error("Error saving student:", error);
      alert("Failed to save student. Please try again.");
    }
  }

  // Handle update operation
  async function handleUpdate() {
    // Update student info
    const { error: studentError } = await supabase
      .from("students")
      .update({
        first_name: formData.first_name,
        last_name: formData.last_name,
        year_level: formData.year_level,
        contact_number: formData.contact_number,
      })
      .eq("id", editingStudent.id);

    if (studentError) throw studentError;

    // Delete existing measurements
    const { error: deleteError } = await supabase
      .from("student_measurements")
      .delete()
      .eq("student_id", editingStudent.id);

    if (deleteError) throw deleteError;

    // Insert updated measurements
    const measurementInserts = Object.entries(formData.measurements)
      .filter(([_, value]) => value !== "")
      .map(([id, value]) => ({
        student_id: editingStudent.id,
        measurement_type_id: id,
        value: parseFloat(value),
      }));

    if (measurementInserts.length > 0) {
      const { error: insertError } = await supabase
        .from("student_measurements")
        .insert(measurementInserts);

      if (insertError) throw insertError;
    }
  }

  // Handle create operation
  async function handleCreate() {
    const { data: newStudent, error: studentError } = await supabase
      .from("students")
      .insert({
        first_name: formData.first_name,
        last_name: formData.last_name,
        course_id: selectedCourse,
        year_level: formData.year_level,
        gender: selectedGender,
        contact_number: formData.contact_number,
      })
      .select()
      .single();

    if (studentError) throw studentError;

    // Insert measurements
    const measurementInserts = Object.entries(formData.measurements)
      .filter(([_, value]) => value !== "")
      .map(([id, value]) => ({
        student_id: newStudent.id,
        measurement_type_id: id,
        value: parseFloat(value),
      }));

    if (measurementInserts.length > 0) {
      const { error: measurementError } = await supabase
        .from("student_measurements")
        .insert(measurementInserts);

      if (measurementError) throw measurementError;
    }
  }

  // Reset form completely
  function resetForm() {
    isRegistering = false;
    isEditing = false;
    editingStudent = null;
    selectedCourse = "";
    selectedGender = "";
    formData = getDefaultFormData();
    measurements = [];
  }

  // Start new registration with clean state
  function startNewRegistration() {
    resetForm();
    isRegistering = true;
  }

  // Edit student with proper state management
  function editStudent(student) {
    isEditing = true;
    editingStudent = student;
    isRegistering = true;
    
    // Set course and gender first (this will trigger loadMeasurementTypes)
    selectedCourse = student.course_id;
    selectedGender = student.gender;
    
    // Set the form data
    formData = {
      first_name: student.first_name,
      last_name: student.last_name,
      year_level: student.year_level,
      contact_number: student.contact_number,
      measurements: {},
    };

    // Set measurements after types are loaded
    if (student.student_measurements) {
      const measurements = {};
      student.student_measurements.forEach((m) => {
        measurements[m.measurement_type_id] = m.value;
      });
      formData.measurements = measurements;
    }
  }

  // Delete student
  async function deleteStudent(id) {
    if (!confirm("Are you sure you want to delete this student?")) return;

    const { error } = await supabase.from("students").delete().eq("id", id);

    if (error) {
      console.error("Error deleting student:", error);
      alert("Failed to delete student");
      return;
    }

    await loadStudents();
  }

  // Update filtered students
  function updateFilteredStudents() {
    filteredStudents = students.filter((student) => {
      const nameMatch = searchQuery
        ? (student.first_name + " " + student.last_name)
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
        : true;

      const courseMatch = filters.course
        ? student.course_id === filters.course
        : true;

      const yearMatch = filters.yearLevel
        ? student.year_level === parseInt(filters.yearLevel)
        : true;

      const genderMatch = filters.gender
        ? student.gender === filters.gender
        : true;

      return nameMatch && courseMatch && yearMatch && genderMatch;
    });
  }

  // Watch for changes in filters
  $: {
    searchQuery;
    filters;
    updateFilteredStudents();
  }

  // Watch for changes in course/gender selection
  $: {
    if (selectedCourse && selectedGender) {
      loadMeasurementTypes();
    }
  }
</script>

<div class="container mx-auto p-4">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold">Student Management</h1>
    <button
      class="btn-primary"
      on:click={() => (isRegistering = !isRegistering) || resetForm()}
    >
      {isRegistering ? "Cancel" : "Register New Student"}
    </button>
  </div>

  {#if isRegistering}
    <form on:submit|preventDefault={handleSubmit} class="space-y-6">
      <div class="grid grid-cols-2 gap-4">
        <div class="form-group">
          <label for="firstName">First Name</label>
          <input
            type="text"
            id="firstName"
            bind:value={formData.first_name}
            required
            class="input"
          />
        </div>

        <div class="form-group">
          <label for="lastName">Last Name</label>
          <input
            type="text"
            id="lastName"
            bind:value={formData.last_name}
            required
            class="input"
          />
        </div>

        <div class="form-group">
          <label for="course">Course</label>
          <select
            id="course"
            bind:value={selectedCourse}
            required
            disabled={isEditing}
            class="input"
          >
            <option value="">Select Course</option>
            {#each courses as course}
              <option value={course.id}>{course.name}</option>
            {/each}
          </select>
        </div>

        <div class="form-group">
          <label for="yearLevel">Year Level</label>
          <select
            id="yearLevel"
            bind:value={formData.year_level}
            required
            class="input"
          >
            {#each [1, 2, 3, 4] as year}
              <option value={year}>{year}</option>
            {/each}
          </select>
        </div>

        <div class="form-group">
          <label>Gender</label>
          <div class="flex gap-4">
            {#each ["MALE", "FEMALE"] as gender}
              <label class="inline-flex items-center">
                <input
                  type="radio"
                  name="gender"
                  value={gender}
                  bind:group={selectedGender}
                  disabled={isEditing}
                  required
                />
                <span class="ml-2">{gender}</span>
              </label>
            {/each}
          </div>
        </div>

        <div class="form-group">
          <label for="contact">Contact Number</label>
          <input
            type="tel"
            id="contact"
            bind:value={formData.contact_number}
            required
            pattern="[0-9-]+"
            class="input"
          />
        </div>
      </div>

      {#if Object.keys(measurements).length > 0}
        <div class="mt-6">
          <h2 class="text-xl font-semibold mb-4">Measurements</h2>
          {#each Object.entries(measurements) as [wearType, measurementList]}
            <div class="mb-6">
              <h3 class="text-lg font-medium mb-2">{wearType}</h3>
              <div class="grid grid-cols-3 gap-4">
                {#each measurementList as measurement}
                  <div class="form-group">
                    <label for={measurement.id}>{measurement.name}</label>
                    <input
                      type="number"
                      id={measurement.id}
                      bind:value={formData.measurements[measurement.id]}
                      required
                      min="0"
                      step="0.1"
                      class="input"
                    />
                  </div>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      {/if}

      <div class="flex justify-end gap-4">
        <button type="button" class="btn-secondary" on:click={resetForm}>
          Cancel
        </button>
        <button type="submit" class="btn-primary">
          {isEditing ? "Update" : "Register"} Student
        </button>
      </div>
    </form>
  {:else}
    <div class="mb-6 space-y-4">
      <div class="flex gap-4">
        <input
          type="search"
          placeholder="Search students..."
          bind:value={searchQuery}
          class="input flex-1"
        />

        <select bind:value={filters.course} class="input w-48">
          <option value="">All Courses</option>
          {#each courses as course}
            <option value={course.id}>{course.name}</option>
          {/each}
        </select>

        <select bind:value={filters.yearLevel} class="input w-36">
          <option value="">All Years</option>
          {#each [1, 2, 3, 4] as year}
            <option value={year}>Year {year}</option>
          {/each}
        </select>

        <select bind:value={filters.gender} class="input w-36">
          <option value="">All Genders</option>
          {#each ["MALE", "FEMALE"] as gender}
            <option value={gender}>{gender}</option>
          {/each}
        </select>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr>
            <th>Name</th>
            <th>Course</th>
            <th>Year</th>
            <th>Gender</th>
            <th>Contact</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each filteredStudents as student (student.id)}
            <tr>
              <td>{student.first_name} {student.last_name}</td>
              <td>{courses.find((c) => c.id === student.course_id)?.name}</td>
              <td>{student.year_level}</td>
              <td>{student.gender}</td>
              <td>{student.contact_number}</td>
              <td>
                <button
                  class="btn-secondary mr-2"
                  on:click={() => editStudent(student)}
                >
                  Edit
                </button>
                <button
                  class="btn-danger"
                  on:click={() => deleteStudent(student.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<style>
  .input {
    @apply w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary;
  }

  .input-search {
    @apply input min-w-[300px];
  }

  .input-select {
    @apply input bg-white;
  }

  .btn-primary {
    @apply px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary;
  }

  .btn-secondary {
    @apply px-4 py-2 bg-secondary text-white rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-secondary;
  }

  .btn-danger {
    @apply px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600;
  }

  .btn-sm {
    @apply px-2 py-1 text-sm;
  }

  .form-group {
    @apply space-y-1;
  }

  .form-group label {
    @apply text-sm font-medium;
  }

  table {
    @apply min-w-full divide-y divide-gray-200;
  }

  th {
    @apply px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider;
  }

  td {
    @apply px-6 py-4 whitespace-nowrap text-sm;
  }

  tr:nth-child(even) {
    @apply bg-gray-50;
  }
</style>
