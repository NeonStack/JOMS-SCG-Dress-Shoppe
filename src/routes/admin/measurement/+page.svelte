<script>
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabaseClient";

  // State management
  let measurementTypes = [];
  let loading = true;
  let error = null;
  let showAddModal = false;
  let showEditModal = false;
  let showDeleteModal = false;
  let currentType = null;

  // Form state
  let newTypeName = "";
  let searchQuery = "";
  let dateRange = { start: "", end: "" };
  let filterUsage = "all"; // all, used, unused

  // Format name to sentence case
  function toSentenceCase(str) {
    return str
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  // Check for duplicate names
  async function checkDuplicateName(name, id = null) {
    const formattedName = toSentenceCase(name);
    const query = supabase
      .from("measurement_types")
      .select("id")
      .ilike("name", formattedName);

    if (id) {
      query.neq("id", id);
    }

    const { data } = await query;
    return data?.length > 0;
  }

  // Fetch measurement types with usage count
  async function fetchMeasurementTypes() {
    try {
      const { data, error: err } = await supabase.from("measurement_types")
        .select(`
            *,
            config_required_measurements(count)
          `);

      if (err) throw err;

      measurementTypes = data.map((type) => ({
        ...type,
        usage_count: type.config_required_measurements[0]?.count || 0,
      }));

      // Apply search filter if any
      if (searchQuery) {
        measurementTypes = measurementTypes.filter(
          (type) =>
            type.id.includes(searchQuery) ||
            type.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      // Apply date range filter if any
      if (dateRange.start && dateRange.end) {
        measurementTypes = measurementTypes.filter(
          (type) =>
            new Date(type.created_at) >= new Date(dateRange.start) &&
            new Date(type.created_at) <= new Date(dateRange.end)
        );
      }

      // Apply usage filter if any
      if (filterUsage !== "all") {
        measurementTypes = measurementTypes.filter((type) =>
          filterUsage === "used" ? type.usage_count > 0 : type.usage_count === 0
        );
      }

      // Sort by name
      measurementTypes.sort((a, b) => a.name.localeCompare(b.name));
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  // Add new measurement type
  async function addMeasurementType() {
    try {
      const formattedName = toSentenceCase(newTypeName);

      // Check for duplicates
      const isDuplicate = await checkDuplicateName(formattedName);
      if (isDuplicate) {
        throw new Error(`Measurement type "${formattedName}" already exists`);
      }

      const { data, error: err } = await supabase
        .from("measurement_types")
        .insert([{ name: formattedName }])
        .select()
        .single();

      if (err) throw err;

      measurementTypes = [...measurementTypes, { ...data, usage_count: 0 }];
      showAddModal = false;
      newTypeName = "";
    } catch (err) {
      error = err.message;
      return false;
    }
    error = "";
    return true;
  }

  // Edit measurement type
  async function editMeasurementType() {
    try {
      const formattedName = toSentenceCase(currentType.name);

      // Check for duplicates
      const isDuplicate = await checkDuplicateName(
        formattedName,
        currentType.id
      );
      if (isDuplicate) {
        throw new Error(`Measurement type "${formattedName}" already exists`);
      }

      const { data, error: err } = await supabase
        .from("measurement_types")
        .update({ name: formattedName })
        .eq("id", currentType.id)
        .select()
        .single();

      if (err) throw err;

      measurementTypes = measurementTypes.map((type) =>
        type.id === currentType.id
          ? { ...data, usage_count: type.usage_count }
          : type
      );

      showEditModal = false;
      currentType = null;
    } catch (err) {
      error = err.message;
      return false;
    }
    return true;
  }

  // Delete measurement type
  async function deleteMeasurementType() {
    try {
      const { error: err } = await supabase
        .from("measurement_types")
        .delete()
        .eq("id", currentType.id);

      if (err) throw err;

      measurementTypes = measurementTypes.filter(
        (type) => type.id !== currentType.id
      );
      showDeleteModal = false;
      currentType = null;
    } catch (err) {
      error = err.message;
    }
  }

  // Initialize data
  onMount(fetchMeasurementTypes);

  $: {
    if (searchQuery || dateRange || filterUsage) {
      fetchMeasurementTypes();
    }
  }
</script>

<div class="container mx-auto px-4 py-8">
  <h1 class="text-2xl font-bold mb-6 text-foreground">
    Measurement Types Management
  </h1>

  <!-- Search and Filter Section -->
  <div class="bg-background rounded-lg shadow p-4 mb-6 border border-border">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label
          for="search"
          class="block text-sm font-medium text-foreground mb-1">Search</label
        >
        <input
          id="search"
          type="text"
          bind:value={searchQuery}
          placeholder="Search by ID or name..."
          class="input-field"
        />
      </div>

      <div>
        <label
          for="dateFilter"
          class="block text-sm font-medium text-foreground mb-1"
          >Date Range</label
        >
        <div class="grid grid-cols-2 gap-2">
          <input
            id="dateStart"
            type="date"
            bind:value={dateRange.start}
            class="input-field"
          />
          <input
            id="dateEnd"
            type="date"
            bind:value={dateRange.end}
            class="input-field"
          />
        </div>
      </div>

      <div>
        <label
          for="usageFilter"
          class="block text-sm font-medium text-foreground mb-1"
          >Usage Filter</label
        >
        <select id="usageFilter" bind:value={filterUsage} class="input-field">
          <option value="all">All Types</option>
          <option value="used">Used Types</option>
          <option value="unused">Unused Types</option>
        </select>
      </div>
    </div>
  </div>

  <!-- Action Buttons -->
  <div class="flex justify-between mb-6">
    <button on:click={() => (showAddModal = true)} class="btn-primary">
      Add New Type
    </button>
  </div>

  <!-- Data Table -->
  {#if loading}
    <div class="text-center py-8 text-foreground">Loading...</div>
  {:else}
    <div
      class="bg-background rounded-lg shadow overflow-x-auto border border-border"
    >
      <table class="min-w-full">
        <thead>
          <tr class="bg-muted">
            <th class="th-cell">ID</th>
            <th class="th-cell">Name</th>
            <th class="th-cell">Created Date</th>
            <th class="th-cell">Usage Count</th>
            <th class="th-cell">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each measurementTypes as type}
            <tr class="border-t border-border">
              <td class="td-cell">{type.id}</td>
              <td class="td-cell">{type.name}</td>
              <td class="td-cell">
                {new Date(type.created_at).toLocaleDateString()}
              </td>
              <td class="td-cell">{type.usage_count}</td>
              <td class="td-cell">
                <div class="flex gap-2">
                  <button
                    on:click={() => {
                      currentType = { ...type };
                      showEditModal = true;
                    }}
                    class="btn-edit"
                    disabled={type.usage_count > 0}
                  >
                    Edit
                  </button>
                  <button
                    on:click={() => {
                      currentType = type;
                      showDeleteModal = true;
                    }}
                    class="btn-delete"
                    disabled={type.usage_count > 0}
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

  <!-- Add Modal -->
  {#if showAddModal}
    <div class="modal-backdrop">
      <div class="modal-content">
        <h2 class="text-xl font-bold mb-4 text-foreground">
          Add New Measurement Type
        </h2>
        <!-- Error Display -->
        {#if error}
          <div
            class="bg-primary/10 border border-primary text-primary px-4 py-3 rounded relative mb-6"
            role="alert"
          >
            <strong class="font-bold">Error!</strong>
            <span class="block sm:inline"> {error}</span>
            <button
              class="absolute top-0 bottom-0 right-0 px-4"
              on:click={() => (error = null)}
            >
              ×
            </button>
          </div>
        {/if}
        <form
          on:submit|preventDefault={async () => {
            if (await addMeasurementType()) {
              showAddModal = false;
            }
          }}
        >
          <label
            for="newTypeName"
            class="block text-sm font-medium text-foreground mb-1"
          >
            Measurement Type Name
          </label>
          <input
            id="newTypeName"
            type="text"
            bind:value={newTypeName}
            placeholder="Enter measurement type name"
            maxlength="50"
            required
            class="input-field mb-4"
          />
          <div class="flex justify-end gap-4">
            <button
              type="button"
              on:click={() => {
                showAddModal = false;
                newTypeName = "";
                error = null;
              }}
              class="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" class="btn-primary"> Add Type </button>
          </div>
        </form>
      </div>
    </div>
  {/if}

  <!-- Edit Modal -->
  {#if showEditModal}
    <div class="modal-backdrop">
      <div class="modal-content">
        <h2 class="text-xl font-bold mb-4 text-foreground">
          Edit Measurement Type
        </h2>
        <form
          on:submit|preventDefault={async () => {
            if (await editMeasurementType()) {
              showEditModal = false;
            }
          }}
        >
          <label
            for="editTypeName"
            class="block text-sm font-medium text-foreground mb-1"
          >
            Measurement Type Name
          </label>
          <input
            id="editTypeName"
            type="text"
            bind:value={currentType.name}
            maxlength="50"
            required
            class="input-field mb-4"
          />
          <div class="flex justify-end gap-4">
            <button
              type="button"
              on:click={() => {
                showEditModal = false;
                currentType = null;
                error = null;
              }}
              class="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" class="btn-primary"> Save Changes </button>
          </div>
        </form>
      </div>
    </div>
  {/if}

  <!-- Delete Modal -->
  {#if showDeleteModal}
    <div class="modal-backdrop">
      <div class="modal-content">
        <h2 class="text-xl font-bold mb-4 text-foreground">
          Delete Measurement Type
        </h2>
        <p class="mb-4 text-foreground">
          Are you sure you want to delete "{currentType?.name}"? This action
          cannot be undone.
        </p>
        <div class="flex justify-end gap-4">
          <button
            on:click={() => {
              showDeleteModal = false;
              currentType = null;
              error = null;
            }}
            class="btn-secondary"
          >
            Cancel
          </button>
          <button on:click={deleteMeasurementType} class="btn-delete">
            Delete
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .input-field {
    @apply w-full px-4 py-2 bg-input border-border border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent;
  }

  .btn-primary {
    @apply px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark focus:ring-2 focus:ring-accent focus:ring-offset-2 transition-colors duration-200;
  }

  .btn-secondary {
    @apply px-4 py-2 bg-secondary text-white rounded-lg hover:opacity-90 focus:ring-2 focus:ring-secondary focus:ring-offset-2 transition-colors duration-200;
  }

  .btn-edit {
    @apply px-3 py-1 bg-accent text-accent-foreground rounded hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200;
  }

  .btn-delete {
    @apply px-3 py-1 bg-primary text-white rounded hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200;
  }

  .th-cell {
    @apply px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider bg-muted;
  }

  .td-cell {
    @apply px-6 py-4 whitespace-nowrap text-sm text-foreground;
  }

  .modal-backdrop {
    @apply fixed inset-0 bg-foreground/50 flex items-center justify-center z-50;
  }

  .modal-content {
    @apply bg-background rounded-lg p-6 max-w-md w-full mx-4 relative shadow-lg border border-border;
  }
</style>
