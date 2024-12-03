<script>
    import { enhance } from '$app/forms';
    import { goto } from '$app/navigation';
    export let data;

    const routeGroups = {
        "Reports": ["/admin/tailor-performance"],
        "Configuration": [
            "/admin/course",
            "/admin/measurement",
            "/admin/uniform-configuration"
        ],
        "Management": [
            "/admin/students",
            "/admin/orders",
            "/admin/account-management"
        ]
    };

    let selectedAdmin = data.selectedAdminId || null;
    let selectedRoutes = [];

    function handleAdminSelect(adminId) {
        selectedAdmin = adminId;
        selectedRoutes = data.permissions
            .filter(p => p.admin_id === adminId)
            .map(p => p.route_path);
        
        // Update URL when admin is selected
        goto(`?admin=${adminId}`, { keepfocus: true });
    }

    // Initialize routes if admin is pre-selected
    if (selectedAdmin) {
        selectedRoutes = data.permissions
            .filter(p => p.admin_id === selectedAdmin)
            .map(p => p.route_path);
    }

    function getRouteName(path) {
        return path.split('/').pop()
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
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
            .filter(p => p.admin_id === selectedAdmin)
            .map(p => p.route_path);
        await new Promise(resolve => setTimeout(resolve, 500)); // For visual feedback
        isResetting = false;
    };
</script>

<div class="min-h-screen p-6">
    <div class="max-w-6xl mx-auto">
        <div class="mb-8 flex items-center gap-8">
            <div>
                <h1 class="text-3xl font-bold text-primary">Admin Permissions</h1>
                <p class="text-gray-600 mt-1">Configure access rights</p>
            </div>
            <div class="flex-1">
                <select 
                    class="select w-full max-w-md p-3 rounded-md cursor-pointer transition-all duration-200 border-2"
                    on:change={(e) => handleAdminSelect(e.target.value)}
                    value={selectedAdmin}
                >
                    <option value="">Select an admin user...</option>
                    {#each data.admins as admin}
                        <option value={admin.id}>
                            {admin.first_name} {admin.last_name}
                        </option>
                    {/each}
                </select>
            </div>
        </div>

        {#if selectedAdmin}
            <form 
                method="POST" 
                action="?/updatePermissions" 
                use:enhance={handleSubmit}
                class="bg-white/80 backdrop-blur rounded-2xl shadow-xl border border-white/50 
                       overflow-hidden transition-all duration-300 animate-scale"
            >
                <input type="hidden" name="adminId" value={selectedAdmin}>
                <input type="hidden" name="permissions" value={JSON.stringify(selectedRoutes)}>
                
                <div class="grid grid-cols-2 gap-6 p-6">
                    {#each Object.entries(routeGroups) as [groupName, routes]}
                        <div class="bg-white/50 rounded-xl p-5 hover:shadow-lg transition-all duration-300
                                  border border-input hover:border-primary/30">
                            <h3 class="font-medium text-lg mb-3 text-primary flex items-center gap-2">
                                <span class="w-2 h-2 rounded-full bg-primary inline-block"></span>
                                {groupName}
                            </h3>
                            <div class="space-y-2">
                                {#each routes as route}
                                    <label class="flex items-center gap-3 p-2 hover:bg-white rounded-lg 
                                                cursor-pointer group transition-all duration-200">
                                        <div class="relative">
                                            <input 
                                                type="checkbox" 
                                                class="peer sr-only"
                                                value={route}
                                                checked={selectedRoutes.includes(route)}
                                                on:change={(e) => {
                                                    if (e.target.checked) {
                                                        selectedRoutes = [...selectedRoutes, route];
                                                    } else {
                                                        selectedRoutes = selectedRoutes.filter(r => r !== route);
                                                    }
                                                }}
                                            >
                                            <div class="w-4 h-4 border-2 border-input rounded 
                                                        peer-checked:bg-primary peer-checked:border-primary 
                                                        transition-all duration-200"></div>
                                            <div class="absolute inset-0 flex items-center justify-center
                                                        text-white scale-0 peer-checked:scale-100 transition-transform">
                                                <svg class="w-3 h-3" viewBox="0 0 24 24">
                                                    <path fill="currentColor" 
                                                          d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z"/>
                                                </svg>
                                            </div>
                                        </div>
                                        <div class="flex-1 min-w-0">
                                            <div class="font-medium truncate group-hover:text-primary transition-colors">
                                                {getRouteName(route)}
                                            </div>
                                            <div class="text-xs text-gray-400 truncate">{route}</div>
                                        </div>
                                    </label>
                                {/each}
                            </div>
                        </div>
                    {/each}
                </div>

                <div class="p-4 bg-gradient-to-b from-white to-muted/30 flex justify-end gap-3 border-t">
                    <button type="button" 
                        class="px-4 py-2 rounded-lg border border-input hover:border-primary/30 
                               hover:bg-white/80 transition-all duration-200 text-sm
                               disabled:opacity-50 disabled:cursor-not-allowed"
                        on:click={handleReset}
                        disabled={isResetting || isSubmitting}
                    >
                        {#if isResetting}
                            <span class="inline-flex items-center gap-2">
                                <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                                </svg>
                                Resetting...
                            </span>
                        {:else}
                            Reset
                        {/if}
                    </button>
                    <button type="submit" 
                        class="px-6 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark 
                               shadow hover:shadow-xl hover:shadow-primary/20 transition-all duration-200
                               disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isSubmitting || isResetting}
                    >
                        {#if isSubmitting}
                            <span class="inline-flex items-center gap-2">
                                <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
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
            <div class="bg-white/80 backdrop-blur rounded-2xl shadow-xl border border-white/50 
                        p-12 text-center animate-scale">
                <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <svg class="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z">
                        </path>
                    </svg>
                </div>
                <h2 class="text-2xl font-semibold text-foreground mb-3">Select an Admin User</h2>
                <p class="text-gray-600 max-w-md mx-auto">
                    Choose an administrator from the dropdown above to manage their permission settings and access rights.
                </p>
                <div class="mt-8 flex justify-center gap-4">
                    <div class="px-4 py-3 rounded-lg bg-muted/50 border border-input flex items-center gap-2 text-sm">
                        <span class="w-2 h-2 rounded-full bg-primary"></span>
                        <span class="text-gray-600">Manage Access permissions</span>
                    </div>
                </div>
            </div>
        {/if}
    </div>
</div>