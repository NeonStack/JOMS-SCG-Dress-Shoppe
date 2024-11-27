<script>
  import { enhance } from '$app/forms';
  
  let username = "";
  let password = "";
  let showPassword = false;
  let loginError = "";
  let loading = false;

  function togglePasswordVisibility() {
    showPassword = !showPassword;
  }

  const handleEnhance = () => {
    loading = true;
    return async ({ result }) => {
        if (result.type === 'success' || result.type === 'redirect') {
            // Handle both success and redirect
            window.location.href = result.location || '/';
            return;
        }
        
        if (result.type === 'failure') {
            loginError = result.data?.error || 'Failed to sign in';
        }
        loading = false;
    };
  };
</script>

<div
  class="min-h-screen bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center p-4"
>
  <div class="flex flex-row gap-16 items-stretch max-lg:items-center justify-center w-full max-w-6xl max-lg:flex-col-reverse max-lg:gap-5">
    <div class="w-1/2 max-lg:w-full max-w-md flex flex-col items-center bg-background p-10 rounded-2xl shadow-2xl">
      <img
        src="./SCGHorizontal.png"
        alt="SCG logo"
        class="w-full max-w-md h-auto object-contain mb-8"
      />
      <div class="w-full max-w-md">
        <h2 class="text-xl font-bold text-foreground mb-4">Job Order Monitoring System</h2>
        <p class="text-secondary mb-2">This system is exclusively for SCG Dress Shoppe employees.</p>
        <p class="text-secondary mb-2">If you're having trouble logging in, please contact the admin.</p>
        <p class="text-primary text-sm mt-4">JOMS v1.0 - Job Order Monitoring System</p>
      </div>
    </div>
    <div class="w-1/2 max-lg:w-full max-w-md flex">
      <div
        class="bg-background rounded-2xl shadow-2xl overflow-hidden w-full"
      >
        <div class="p-8">
          <h2 class="text-3xl font-bold text-primary text-center mb-8">
            SIGN IN
          </h2>

          {#if loginError}
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span class="block sm:inline">{loginError}</span>
            </div>
          {/if}

          <form 
            class="space-y-6" 
            method="POST"
            action="?/signin"
            use:enhance={handleEnhance}
          >
            <div>
              <label
                for="username"
                class="block text-sm font-medium text-foreground mb-1"
                >Username</label
              >
              <input
                type="text"
                id="username"
                name="username"
                bind:value={username}
                class="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all"
                placeholder="Enter your username"
                required
              />
            </div>

            <div class="relative">
              <label
                for="password"
                class="block text-sm font-medium text-foreground mb-1"
                >Password</label
              >
              <div class="relative">
                {#if showPassword}
                  <input
                    type="text"
                    id="password"
                    name="password"
                    bind:value={password}
                    class="w-full px-4 py-3 pr-10 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all"
                    placeholder="Enter your password"
                    required
                  />
                {:else}
                  <input
                    type="password"
                    id="password"
                    name="password"
                    bind:value={password}
                    class="w-full px-4 py-3 pr-10 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all"
                    placeholder="Enter your password"
                    required
                  />
                {/if}
                <button
                  type="button"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                  on:click={togglePasswordVisibility}
                >
                  {#if showPassword}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5 text-primary"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path
                        fill-rule="evenodd"
                        d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  {:else}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5 text-primary"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                        clip-rule="evenodd"
                      />
                      <path
                        d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z"
                      />
                    </svg>
                  {/if}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              class="w-full bg-primary text-accent-foreground py-3 rounded-lg font-semibold hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 transition-all select-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {#if loading}
              <svg class="animate-spin h-5 w-5 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {:else}
              Sign in
              {/if}
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</div>