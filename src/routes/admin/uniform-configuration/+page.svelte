<script>
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabaseClient";

  // State management
  let configs = [];
  let courses = [];
  let measurementTypes = [];
  let loading = true;
  let error = null;

  // Form state
  let showCreateModal = false;
  let editingConfig = null;
  let formData = {
    courseId: "",
    gender: "MALE",
    wearType: "UPPER",
    basePrice: "",
    selectedMeasurements: [],
  };

  // Filter state
  let filters = {
    courses: [],
    genders: [],
    wearTypes: [],
    priceMin: "",
    priceMax: "",
    dateStart: "",
    dateEnd: "",
    search: "",
  };

  function clearFilters() {
    filters = {
      courses: [],
      genders: [],
      wearTypes: [],
      priceMin: "",
      priceMax: "",
      dateStart: "",
      dateEnd: "",
      search: "",
    };
  }

  // Sort state
  let sortField = "created_at";
  let sortDirection = "desc";

  // Fetch data
  async function fetchData() {
    try {
      loading = true;

      // Fetch courses
      const { data: coursesData, error: coursesError } = await supabase
        .from("courses")
        .select("*");
      if (coursesError) throw coursesError;
      courses = coursesData;

      // Fetch measurement types
      const { data: measurementsData, error: measurementsError } =
        await supabase.from("measurement_types").select("*");
      if (measurementsError) throw measurementsError;
      measurementTypes = measurementsData;

      // Fetch configurations with joins
      const { data: configsData, error: configsError } = await supabase.from(
        "uniform_configs"
      ).select(`
            *,
            courses:course_id(name),
            config_required_measurements(
              measurement_type_id
            )
          `);
      if (configsError) throw configsError;
      configs = configsData;
    } catch (e) {
      error = e.message;
    } finally {
      loading = false;
    }
  }

  // Apply filters and sorting
  $: filteredConfigs = configs
    .filter((config) => {
      const matchesCourses =
        filters.courses.length === 0 ||
        filters.courses.includes(config.course_id);
      const matchesGender =
        filters.genders.length === 0 || filters.genders.includes(config.gender);
      const matchesWearType =
        filters.wearTypes.length === 0 ||
        filters.wearTypes.includes(config.wear_type);
      const matchesPrice =
        (!filters.priceMin || config.base_price >= filters.priceMin) &&
        (!filters.priceMax || config.base_price <= filters.priceMax);
      const matchesDate =
        (!filters.dateStart ||
          new Date(config.created_at) >= new Date(filters.dateStart)) &&
        (!filters.dateEnd ||
          new Date(config.created_at) <= new Date(filters.dateEnd));
      const matchesSearch =
        !filters.search ||
        config.id.toLowerCase().includes(filters.search.toLowerCase()) ||
        config.courses.name
          .toLowerCase()
          .includes(filters.search.toLowerCase());

      return (
        matchesCourses &&
        matchesGender &&
        matchesWearType &&
        matchesPrice &&
        matchesDate &&
        matchesSearch
      );
    })
    .sort((a, b) => {
      const direction = sortDirection === "asc" ? 1 : -1;
      if (sortField === "required_measurements_count") {
        return (
          direction *
          (a.config_required_measurements.length -
            b.config_required_measurements.length)
        );
      }
      return direction * (a[sortField] < b[sortField] ? -1 : 1);
    });

  // Form submission
  async function handleSubmit() {
    error = null;
    try {
      const configData = {
        course_id: formData.courseId,
        gender: formData.gender,
        wear_type: formData.wearType,
        base_price: parseFloat(formData.basePrice),
      };

      let configId;

      if (editingConfig) {
        const { error: updateError } = await supabase
          .from("uniform_configs")
          .update(configData)
          .eq("id", editingConfig.id);
        if (updateError) throw updateError;
        configId = editingConfig.id;
      } else {
        const { data, error: insertError } = await supabase
          .from("uniform_configs")
          .insert(configData)
          .select()
          .single();
        if (insertError) throw insertError;
        configId = data.id;
      }

      // Update measurements
      if (editingConfig) {
        await supabase
          .from("config_required_measurements")
          .delete()
          .eq("uniform_config_id", configId);
      }

      const measurementData = formData.selectedMeasurements.map(
        (measurementId) => ({
          uniform_config_id: configId,
          measurement_type_id: measurementId,
        })
      );

      const { error: measurementError } = await supabase
        .from("config_required_measurements")
        .insert(measurementData);
      if (measurementError) throw measurementError;

      await fetchData();
      resetForm();
    } catch (e) {
      error = e.message;
    }
  }

  function resetForm() {
    formData = {
      courseId: "",
      gender: "MALE",
      wearType: "UPPER",
      basePrice: "",
      selectedMeasurements: [],
    };
    editingConfig = null;
    showCreateModal = false;
    error = null;
  }

  function editConfig(config) {
    editingConfig = config;
    formData = {
      courseId: config.course_id,
      gender: config.gender,
      wearType: config.wear_type,
      basePrice: config.base_price.toString(),
      selectedMeasurements: config.config_required_measurements.map(
        (m) => m.measurement_type_id
      ),
    };
    showCreateModal = true;
  }

  async function deleteConfig(id) {
    if (confirm("Are you sure you want to delete this configuration?")) {
      const { error: deleteError } = await supabase
        .from("uniform_configs")
        .delete()
        .eq("id", id);
      if (deleteError) {
        error = deleteError.message;
      } else {
        await fetchData();
      }
    }
  }

  onMount(fetchData);
</script>

<div class="p-6">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold text-foreground">
      Uniform Configuration Management
    </h1>
    <button
      class="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded"
      on:click={() => (showCreateModal = true)}
    >
      Create New Configuration
    </button>
  </div>

  <!-- Filters -->
  <div class="bg-white p-4 rounded-lg shadow mb-6">
    <h2 class="text-lg font-semibold mb-4">Filters</h2>
    <button class="btn-primary" on:click={clearFilters}>Clear Filters</button>
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label for="courseFilter" class="block text-sm font-medium mb-1"
          >Courses</label
        >
        <select
          id="courseFilter"
          name="courseFilter"
          class="w-full border-border rounded p-2"
          multiple
          bind:value={filters.courses}
        >
          {#each courses as course}
            <option value={course.id}>{course.name}</option>
          {/each}
        </select>
      </div>

      <div>
        <label for="genderFilter" class="block text-sm font-medium mb-1"
          >Gender</label
        >
        <select
          id="genderFilter"
          name="genderFilter"
          class="w-full border-border rounded p-2"
          multiple
          bind:value={filters.genders}
        >
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
        </select>
      </div>

      <div>
        <label for="wearTypeFilter" class="block text-sm font-medium mb-1"
          >Wear Type</label
        >
        <select
          id="wearTypeFilter"
          name="wearTypeFilter"
          class="w-full border-border rounded p-2"
          multiple
          bind:value={filters.wearTypes}
        >
          <option value="UPPER">Upper</option>
          <option value="LOWER">Lower</option>
        </select>
      </div>

      <div class="border-2 border-black">
        <div class="mb-10">
          <label for="priceMin" class="block text-sm font-medium mb-1"
            >Min Price</label
          >
          <input
            type="number"
            id="priceMin"
            name="priceMin"
            class="w-full border-border rounded p-2"
            bind:value={filters.priceMin}
          />
        </div>

        <div>
          <label for="priceMax" class="block text-sm font-medium mb-1"
            >Max Price</label
          >
          <input
            type="number"
            id="priceMax"
            name="priceMax"
            class="w-full border-border rounded p-2"
            bind:value={filters.priceMax}
          />
        </div>
      </div>

      <div>
        <label for="search" class="block text-sm font-medium mb-1">Search</label
        >
        <input
          type="text"
          id="search"
          name="search"
          class="w-full border-border rounded p-2"
          placeholder="Search by ID or course name..."
          bind:value={filters.search}
        />
      </div>
    </div>
  </div>

  <!-- Table -->
  {#if loading}
    <div class="text-center py-8">Loading...</div>
  {:else if error}
    <div class="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>
  {:else}
    <div class="bg-white rounded-lg shadow overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="bg-muted">
            <th class="p-4 text-left">
              <button
                class="font-semibold"
                on:click={() => {
                  if (sortField === "id") {
                    sortDirection = sortDirection === "asc" ? "desc" : "asc";
                  } else {
                    sortField = "id";
                    sortDirection = "asc";
                  }
                }}
              >
                Config ID
              </button>
            </th>
            <th class="p-4 text-left">
              <button
                class="font-semibold"
                on:click={() => {
                  if (sortField === "courses.name") {
                    sortDirection = sortDirection === "asc" ? "desc" : "asc";
                  } else {
                    sortField = "courses.name";
                    sortDirection = "asc";
                  }
                }}
              >
                Course
              </button>
            </th>
            <th class="p-4 text-left">Gender</th>
            <th class="p-4 text-left">Wear Type</th>
            <th class="p-4 text-left">
              <button
                class="font-semibold"
                on:click={() => {
                  if (sortField === "base_price") {
                    sortDirection = sortDirection === "asc" ? "desc" : "asc";
                  } else {
                    sortField = "base_price";
                    sortDirection = "asc";
                  }
                }}
              >
                Base Price
              </button>
            </th>
            <th class="p-4 text-left">
              <button
                class="font-semibold"
                on:click={() => {
                  if (sortField === "required_measurements_count") {
                    sortDirection = sortDirection === "asc" ? "desc" : "asc";
                  } else {
                    sortField = "required_measurements_count";
                    sortDirection = "asc";
                  }
                }}
              >
                Required Measurements
              </button>
            </th>
            <th class="p-4 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each filteredConfigs as config}
            <tr class="border-t border-border">
              <td class="p-4">{config.id}</td>
              <td class="p-4">{config.courses.name}</td>
              <td class="p-4">{config.gender}</td>
              <td class="p-4">{config.wear_type}</td>
              <td class="p-4">₱{config.base_price.toFixed(2)}</td>
              <td class="p-4">{config.config_required_measurements.length}</td>
              <td class="p-4">
                <div class="flex gap-2">
                  <button
                    class="text-primary hover:text-primary-dark"
                    on:click={() => editConfig(config)}
                  >
                    Edit
                  </button>
                  <button
                    class="text-red-600 hover:text-red-800"
                    on:click={() => deleteConfig(config.id)}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<!-- Create/Edit Modal -->
{#if showCreateModal}
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
  >
    <div class="bg-white rounded-lg p-6 max-w-2xl w-full overflow-y-visible">
      <h2 class="text-xl font-bold mb-4">
        {editingConfig ? "Edit Configuration" : "Create New Configuration"}
      </h2>

      <form on:submit|preventDefault={handleSubmit}>
        <div class="space-y-4">
          <div>
            <label for="course" class="block text-sm font-medium mb-1"
              >Course</label
            >
            <select
              id="course"
              name="course"
              class="w-full border-border rounded p-2"
              bind:value={formData.courseId}
              required
            >
              <option value="">Select a course</option>
              {#each courses as course}
                <option value={course.id}>{course.name}</option>
              {/each}
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1" for="gender"
              >Gender</label
            >
            <div class="flex gap-4">
              <label class="flex items-center">
                <input
                  type="radio"
                  name="gender"
                  value="MALE"
                  bind:group={formData.gender}
                  class="mr-2"
                />
                Male
              </label>
              <label class="flex items-center">
                <input
                  type="radio"
                  name="gender"
                  value="FEMALE"
                  bind:group={formData.gender}
                  class="mr-2"
                />
                Female
              </label>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1" for="wearType"
              >Wear Type</label
            >
            <div class="flex gap-4">
              <label class="flex items-center">
                <input
                  type="radio"
                  name="wearType"
                  value="UPPER"
                  bind:group={formData.wearType}
                  class="mr-2"
                />
                Upper
              </label>
              <label class="flex items-center">
                <input
                  type="radio"
                  name="wearType"
                  value="LOWER"
                  bind:group={formData.wearType}
                  class="mr-2"
                />
                Lower
              </label>
            </div>
          </div>

          <div>
            <label for="basePrice" class="block text-sm font-medium mb-1"
              >Base Price</label
            >
            <input
              type="number"
              id="basePrice"
              name="basePrice"
              min="0.01"
              step="0.01"
              class="w-full border-border rounded p-2"
              bind:value={formData.basePrice}
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1" for="measurements"
              >Required Measurements</label
            >
            <div
              class="space-y-2 max-h-48 overflow-y-auto border border-border rounded p-2"
            >
              {#each measurementTypes as measurement}
                <label class="flex items-center">
                  <input
                    type="checkbox"
                    name="measurements"
                    value={measurement.id}
                    bind:group={formData.selectedMeasurements}
                    class="mr-2"
                  />
                  {measurement.name}
                </label>
              {/each}
            </div>
          </div>
        </div>

        {#if error}
          <div class="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>
        {/if}

        <div class="flex justify-end gap-4 mt-6">
          <button
            type="button"
            class="px-4 py-2 text-secondary hover:text-foreground"
            on:click={resetForm}
          >
            Cancel
          </button>
          <button
            type="submit"
            class="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded"
          >
            {editingConfig ? "Update" : "Create"}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  /* Apply common styles using @apply */
  .btn-primary {
    @apply bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark;
  }

  option {
    @apply border-b-border border-b-2 p-2;
  }

  input,
  select {
    @apply w-full border-2 rounded p-2 shadow-lg;
  }

  label {
    @apply block text-sm font-medium mb-1;
  }

  th {
    @apply p-4 text-left font-semibold;
  }

  td {
    @apply p-4;
  }
</style>
