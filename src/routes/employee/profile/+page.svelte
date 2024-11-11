<script>
    export let data;
    export let form;
    const { profile } = data;

    let editing = false;
    let formData = {
        first_name: profile.first_name,
        last_name: profile.last_name,
        contact_number: profile.contact_number || '',
        address: profile.address || ''
    };

    const initials = `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    const displayRole = profile.role === 'employee' ? 'Tailor' : profile.role;

    function toggleEdit() {
        editing = !editing;
        if (!editing) {
            // Reset form data if canceling
            formData = {
                first_name: profile.first_name,
                last_name: profile.last_name,
                contact_number: profile.contact_number || '',
                address: profile.address || ''
            };
        }
    }
</script>

<div class="max-w-3xl mx-auto p-6">
    <div class="space-y-8">
        <div class="flex items-center justify-between">
            <div class="flex items-center space-x-6">
                <div class="w-24 h-24 rounded-full bg-primary flex items-center justify-center">
                    <span class="text-3xl font-bold text-accent-foreground">{initials}</span>
                </div>
                <div>
                    <h2 class="text-2xl font-bold text-foreground">
                        {profile.first_name} {profile.last_name}
                    </h2>
                    <p class="text-secondary">{displayRole}</p>
                </div>
            </div>
            <button 
                class="px-4 py-2 text-sm rounded-md {editing ? 'bg-error/20 text-error' : 'bg-primary text-accent-foreground'}"
                on:click={toggleEdit}
            >
                {editing ? 'Cancel' : 'Edit Profile'}
            </button>
        </div>

        {#if editing}
            <form method="POST" action="?/updateProfile" class="bg-muted rounded-lg p-6 shadow-sm space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="space-y-2">
                        <label class="text-sm font-medium text-secondary" for="first_name">First Name</label>
                        <input 
                            type="text" 
                            id="first_name" 
                            name="first_name"
                            class="w-full p-2 rounded-md bg-input border border-border"
                            bind:value={formData.first_name}
                            required
                        />
                    </div>
                    <div class="space-y-2">
                        <label class="text-sm font-medium text-secondary" for="last_name">Last Name</label>
                        <input 
                            type="text" 
                            id="last_name" 
                            name="last_name"
                            class="w-full p-2 rounded-md bg-input border border-border"
                            bind:value={formData.last_name}
                            required
                        />
                    </div>
                    <div class="space-y-2">
                        <label class="text-sm font-medium text-secondary" for="contact_number">Contact Number</label>
                        <input 
                            type="tel" 
                            id="contact_number" 
                            name="contact_number"
                            class="w-full p-2 rounded-md bg-input border border-border"
                            bind:value={formData.contact_number}
                        />
                    </div>
                    <div class="space-y-2">
                        <label class="text-sm font-medium text-secondary" for="address">Address</label>
                        <input 
                            type="text" 
                            id="address" 
                            name="address"
                            class="w-full p-2 rounded-md bg-input border border-border"
                            bind:value={formData.address}
                        />
                    </div>
                </div>
                <div class="flex justify-end space-x-4">
                    <button 
                        type="submit"
                        class="px-4 py-2 bg-primary text-accent-foreground rounded-md hover:bg-accent"
                    >
                        Save Changes
                    </button>
                </div>
            </form>
        {:else}
            <div class="bg-muted rounded-lg p-6 shadow-sm">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="space-y-4">
                        <div>
                            <label class="text-sm font-medium text-secondary">Position</label>
                            <p class="mt-1 text-foreground font-medium">{profile.position}</p>
                        </div>
                        <div>
                            <label class="text-sm font-medium text-secondary">Email</label>
                            <p class="mt-1 text-foreground font-medium">{profile.email}</p>
                        </div>
                        <div>
                            <label class="text-sm font-medium text-secondary">Contact Number</label>
                            <p class="mt-1 text-foreground font-medium">{profile.contact_number || 'Not set'}</p>
                        </div>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <label class="text-sm font-medium text-secondary">Address</label>
                            <p class="mt-1 text-foreground font-medium">{profile.address || 'Not set'}</p>
                        </div>
                        <div>
                            <label class="text-sm font-medium text-secondary">Last Sign In</label>
                            <p class="mt-1 text-foreground font-medium">
                                {new Date(profile.lastSignIn).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        {/if}

        <div class="bg-accent/10 rounded p-4 text-sm text-secondary">
            <p>Please contact your administrator for other profile information updates.</p>
        </div>
    </div>

    {#if form?.error}
        <div class="mt-4 p-4 bg-error/10 text-error rounded-md">
            {form.error}
        </div>
    {/if}
</div>