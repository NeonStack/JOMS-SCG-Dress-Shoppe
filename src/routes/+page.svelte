<script>
  import { onMount } from 'svelte';
  let username = "";
  let password = "";
  let showPassword = false;
  let rememberMe = false;

  function togglePasswordVisibility() {
    showPassword = !showPassword;
  }

  function handleSubmit(e) {
    e.preventDefault();
    // Add your login logic here
    console.log({ username, password, rememberMe });
  }

  onMount(() => {
    // Any initialization logic can go here
  });
</script>

<div class="min-h-screen bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center p-4">
  <div class="w-full max-w-md">
    <div class="bg-background rounded-2xl shadow-2xl overflow-hidden">
      <div class="p-8">
        <h2 class="text-3xl font-bold text-foreground text-center mb-2">SIGN-IN</h2>
        <p class="text-secondary text-center mb-8">Enter your credentials to continue</p>
        
        <form class="space-y-6" on:submit={handleSubmit}>
          <div>
            <label for="username" class="block text-sm font-medium text-foreground mb-1">Username</label>
            <input
              type="text"
              id="username"
              bind:value={username}
              class="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all"
              placeholder="Enter your username"
              required
            />
          </div>

          <div class="relative">
            <label for="password" class="block text-sm font-medium text-foreground mb-1">Password</label>
            <div class="relative">
              {#if showPassword}
                <input
                  type="text"
                  id="password"
                  bind:value={password}
                  class="w-full px-4 py-3 pr-10 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all"
                  placeholder="Enter your password"
                  required
                />
              {:else}
                <input
                  type="password"
                  id="password"
                  bind:value={password}
                  class="w-full px-4 py-3 pr-10 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all"
                  placeholder="Enter your password"
                  required
                />
              {/if}
              <button
                type="button"
                class="absolute inset-y-0 right-0 pr-3 flex items-center"
                on:click={togglePasswordVisibility}
              >
                {#if showPassword}
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-accent" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
                  </svg>
                {:else}
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-accent" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd" />
                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                  </svg>
                {/if}
              </button>
            </div>
          </div>

          <div class="flex items-center justify-end">
            <input 
              type="checkbox" 
              id="remember-me"
              bind:checked={rememberMe}
              class="w-4 h-4 rounded border-input text-accent focus:ring-accent" 
            />
            <label for="remember-me" class="ml-2 block text-sm text-secondary">Remember me</label>
          </div>

          <button
            type="submit"
            class="w-full bg-accent text-accent-foreground py-3 rounded-lg font-semibold hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 transition-all"
          >
            Sign in
          </button>
        </form>
      </div>

      <div class="p-8 bg-muted border-t border-border">
        <p class="text-center text-secondary">
          Admins and employees only.
        </p>
        <p class="text-center text-secondary">
          Contact management if you need access.
        </p>
      </div>
    </div>
  </div>
</div>