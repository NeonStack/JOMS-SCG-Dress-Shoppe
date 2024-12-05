<script>
  import { enhance } from "$app/forms";
  import { goto } from "$app/navigation";
  export let data;

  const routeGroups = {
    Reports: ["/admin/tailor-performance"],
    Configuration: [
      "/admin/course",
      "/admin/measurement",
      "/admin/uniform-configuration",
    ],
    Management: [
      "/admin/students",
      "/admin/orders",
      "/admin/account-management",
    ],
  };

  let selectedAdmin = data.selectedAdminId || null;
  let selectedRoutes = [];

  function handleAdminSelect(adminId) {
    selectedAdmin = adminId;
    selectedRoutes = data.permissions
      .filter((p) => p.admin_id === adminId)
      .map((p) => p.route_path);

    // Update URL when admin is selected
    goto(`?admin=${adminId}`, { keepfocus: true });
  }

  // Initialize routes if admin is pre-selected
  if (selectedAdmin) {
    selectedRoutes = data.permissions
      .filter((p) => p.admin_id === selectedAdmin)
      .map((p) => p.route_path);
  }

  function getRouteName(path) {
    return path
      .split("/")
      .pop()
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  let isSubmitting = false;
  let isResetting = false;

  const handleSubmit = () => {
    return async ({ update }) => {
      isSubmitting = true;
      await update();
      // Reload the page to refresh data while maintaining the selected admin
      window.location.reload();
    };
  };

  const handleReset = async () => {
    isResetting = true;
    // Get original permissions for the selected admin
    selectedRoutes = data.permissions
      .filter((p) => p.admin_id === selectedAdmin)
      .map((p) => p.route_path);
    await new Promise((resolve) => setTimeout(resolve, 500)); // For visual feedback
    isResetting = false;
  };
</script>

<div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50 p-6">
  <div class="max-w-7xl mx-auto space-y-6">
    <!-- Header Section -->
    <div class="bg-white rounded-2xl shadow-sm border p-6">
      <div class="flex flex-col md:flex-row md:items-center gap-6">
        <div class="flex-1">
          <!-- Header Section -->
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-4">
              <div class="bg-primary/10 p-3 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="w-6 h-6 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                <path fill="currentColor" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12c5.16-1.26 9-6.45 9-12V5zm0 11h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
                </svg>
              </div>
              <div>
                <h1 class="text-2xl font-bold text-gray-800">
                    Permission Settings
                </h1>
                <p class="text-sm text-gray-500">
                  Manage access rights for administrative users
                </p>
              </div>
            </div>
          </div>
        </div>
        <div class="md:w-96">
          <select
            class="select w-full bg-gray-50 p-3 rounded-xl cursor-pointer transition-all
                               duration-200 border-2 hover:border-primary/30 focus:border-primary"
            on:change={(e) => handleAdminSelect(e.target.value)}
            value={selectedAdmin}
          >
            <option value="">Select an administrator...</option>
            {#each data.admins as admin}
              <option value={admin.id}>
                {admin.first_name}
                {admin.last_name}
              </option>
            {/each}
          </select>
        </div>
      </div>
    </div>

    {#if selectedAdmin}
      <form
        method="POST"
        action="?/updatePermissions"
        use:enhance={handleSubmit}
        class="bg-white rounded-2xl shadow-sm border overflow-hidden transition-all duration-300"
      >
        <input type="hidden" name="adminId" value={selectedAdmin} />
        <input
          type="hidden"
          name="permissions"
          value={JSON.stringify(selectedRoutes)}
        />

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {#each Object.entries(routeGroups) as [groupName, routes]}
            <div
              class="bg-gray-50 rounded-xl p-5 hover:shadow-md transition-all duration-300
                                  border hover:border-primary/20"
            >
              <h3
                class="font-semibold text-base mb-4 text-primary/90 flex items-center gap-2"
              >
                <span class="w-2 h-2 rounded-full bg-primary inline-block"
                ></span>
                {groupName}
              </h3>
              <div class="space-y-2.5">
                {#each routes as route}
                  <label
                    class="flex items-center gap-3 p-2 hover:bg-white rounded-lg
                                                cursor-pointer group transition-all duration-200"
                  >
                    <div class="relative flex-shrink-0">
                      <input
                        type="checkbox"
                        class="peer sr-only"
                        value={route}
                        checked={selectedRoutes.includes(route)}
                        on:change={(e) => {
                          if (e.target.checked) {
                            selectedRoutes = [...selectedRoutes, route];
                          } else {
                            selectedRoutes = selectedRoutes.filter(
                              (r) => r !== route
                            );
                          }
                        }}
                      />
                      <div
                        class="w-5 h-5 border-2 border-gray-300 rounded-md
                                                        peer-checked:bg-primary peer-checked:border-primary
                                                        transition-all duration-200"
                      ></div>
                      <div
                        class="absolute inset-0 flex items-center justify-center
                                                        text-white scale-0 peer-checked:scale-100 transition-transform"
                      >
                        <svg class="w-3 h-3" viewBox="0 0 24 24">
                          <path
                            fill="currentColor"
                            d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z"
                          />
                        </svg>
                      </div>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div
                        class="font-medium text-sm group-hover:text-primary transition-colors"
                      >
                        {getRouteName(route)}
                      </div>
                      <div class="text-xs text-gray-400">{route}</div>
                    </div>
                  </label>
                {/each}
              </div>
            </div>
          {/each}
        </div>

        <div class="p-6 bg-gray-50 flex justify-end gap-3 border-t">
          <button
            type="button"
            class="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50
                               hover:border-primary/30 transition-all duration-200 text-sm
                               disabled:opacity-50 disabled:cursor-not-allowed"
            on:click={handleReset}
            disabled={isResetting || isSubmitting}
          >
            {#if isResetting}
              <span class="inline-flex items-center gap-2">
                <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                    fill="none"
                  />
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Resetting...
              </span>
            {:else}
              Reset Changes
            {/if}
          </button>
          <button
            type="submit"
            class="px-6 py-2 rounded-lg bg-primary text-white hover:bg-primary/90
                               shadow-sm hover:shadow-md hover:shadow-primary/10 transition-all duration-200
                               disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting || isResetting}
          >
            {#if isSubmitting}
              <span class="inline-flex items-center gap-2">
                <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                    fill="none"
                  />
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Saving...
              </span>
            {:else}
              Save Changes
            {/if}
          </button>
        </div>
      </form>
    {:else}
      <div class="bg-white rounded-2xl shadow-sm border p-12 text-center">
        <div
          class="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center"
        >
          <svg
            class="w-8 h-8 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        </div>
        <h2 class="text-xl font-semibold text-gray-800 mb-3">
          No Administrator Selected
        </h2>
        <p class="text-gray-500 max-w-md mx-auto text-sm">
          Please select an administrator from the dropdown above to manage their
          permissions and access rights.
        </p>
      </div>
    {/if}
  </div>
</div>
