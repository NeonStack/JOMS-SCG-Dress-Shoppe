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

    let errors = {
        first_name: '',
        last_name: '',
        contact_number: '',
        address: ''
    };

    // Validation functions
    function cleanWhitespace(str) {
        return str.replace(/\s+/g, ' ').trim();
    }

    function validateName(name, field) {
        if (!name) {
            errors[field] = 'Name is required';
            return false;
        }
        if (name.length < 2 || name.length > 50) {
            errors[field] = 'Must be between 2-50 characters';
            return false;
        }
        if (!/^[a-zA-Z\s.]+$/.test(name)) {
            errors[field] = 'Only letters, spaces, and dots allowed';
            return false;
        }
        errors[field] = '';
        return true;
    }

    function validatePhone(phone) {
        if (!phone) {
            errors.contact_number = 'Contact number is required';
            return false;
        }
        if (!/^09\d{9}$/.test(phone)) {
            errors.contact_number = 'Must be 11 digits starting with 09';
            return false;
        }
        errors.contact_number = '';
        return true;
    }

    function validateAddress(address) {
        if (!address) {
            errors.address = 'Address is required';
            return false;
        }
        if (address.length < 5 || address.length > 200) {
            errors.address = 'Must be between 5-200 characters';
            return false;
        }
        if (!/^[a-zA-Z0-9\s,.\-#]+$/.test(address)) {
            errors.address = 'Only letters, numbers, spaces, commas, dots, hyphens, and #';
            return false;
        }
        errors.address = '';
        return true;
    }

    let isSubmitting = false;

    async function handleSubmit(event) {
        // Clean whitespace only when submitting
        formData.first_name = formData.first_name.replace(/\s+/g, ' ').trim();
        formData.last_name = formData.last_name.replace(/\s+/g, ' ').trim();
        formData.address = formData.address.replace(/\s+/g, ' ').trim();

        const isFirstNameValid = validateName(formData.first_name, 'first_name');
        const isLastNameValid = validateName(formData.last_name, 'last_name');
        const isPhoneValid = validatePhone(formData.contact_number);
        const isAddressValid = validateAddress(formData.address);

        if (!isFirstNameValid || !isLastNameValid || !isPhoneValid || !isAddressValid) {
            event.preventDefault();
            return;
        }

        isSubmitting = true;
    }

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
            <form method="POST" action="?/updateProfile" class="bg-muted rounded-lg p-6 shadow-sm space-y-6" on:submit={handleSubmit}>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="space-y-2">
                        <label class="text-sm font-medium text-secondary" for="first_name">First Name</label>
                        <input 
                            type="text" 
                            id="first_name" 
                            name="first_name"
                            class="w-full p-2 rounded-md bg-input border border-border"
                            bind:value={formData.first_name}
                            on:input={() => validateName(formData.first_name, 'first_name')}
                            required
                        />
                        {#if errors.first_name}
                            <p class="text-xs text-error mt-1">{errors.first_name}</p>
                        {/if}
                    </div>
                    <div class="space-y-2">
                        <label class="text-sm font-medium text-secondary" for="last_name">Last Name</label>
                        <input 
                            type="text" 
                            id="last_name" 
                            name="last_name"
                            class="w-full p-2 rounded-md bg-input border border-border"
                            bind:value={formData.last_name}
                            on:input={() => validateName(formData.last_name, 'last_name')}
                            required
                        />
                        {#if errors.last_name}
                            <p class="text-xs text-error mt-1">{errors.last_name}</p>
                        {/if}
                    </div>
                    <div class="space-y-2">
                        <label class="text-sm font-medium text-secondary" for="contact_number">Contact Number</label>
                        <input 
                            type="tel" 
                            id="contact_number" 
                            name="contact_number"
                            class="w-full p-2 rounded-md bg-input border border-border"
                            bind:value={formData.contact_number}
                            on:input={() => formData.contact_number && validatePhone(formData.contact_number)}
                            placeholder="09XXXXXXXXX"
                        />
                        {#if errors.contact_number}
                            <p class="text-xs text-error mt-1">{errors.contact_number}</p>
                        {/if}
                    </div>
                    <div class="space-y-2">
                        <label class="text-sm font-medium text-secondary" for="address">Address</label>
                        <input 
                            type="text" 
                            id="address" 
                            name="address"
                            class="w-full p-2 rounded-md bg-input border border-border"
                            bind:value={formData.address}
                            on:input={() => formData.address && validateAddress(formData.address)}
                        />
                        {#if errors.address}
                            <p class="text-xs text-error mt-1">{errors.address}</p>
                        {/if}
                    </div>
                </div>
                <div class="flex justify-end space-x-4">
                    <button 
                        type="submit"
                        class="px-4 py-2 bg-primary text-accent-foreground rounded-md hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isSubmitting}
                    >
                        {#if isSubmitting}
                            <span class="inline-flex items-center">
                                <svg class="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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