<script>
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { onMount, tick } from "svelte";
  import { fade } from "svelte/transition";
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';

  let showSidebar = false;
  const { userRole, userProfile } = $page.data;
  
  let showProfileModal = false;
  let isEditingProfile = false;

  let profileImage = userProfile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent((userProfile?.first_name?.[0] || "") + (userProfile?.last_name?.[0] || ""))}&background=B73233&color=fff`;
  
  $: userName = userProfile ? `${userProfile.first_name} ${userProfile.last_name}` : "Employee";

  function toggleProfileModal() {
    showProfileModal = !showProfileModal;
  }

  function handleClickOutside(event) {
    const modal = document.getElementById('profileModal');
    if (modal && !modal.contains(event.target) && !isEditingProfile) {
      showProfileModal = false;
    }
  }

  const navigation = [
    {
      name: "Dashboard",
      href: "/employee/dashboard",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24"><path fill="currentColor" d="M3 13h8V3H3zm0 8h8v-6H3zm10 0h8V11h-8zm0-18v6h8V3z" /></svg>`,
    },
    {
      name: "Orders",
      href: "/employee/orders",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 16 16"><path fill="currentColor" fill-rule="evenodd" d="M5.5 1a.5.5 0 0 0-.477.65l.11.35H3.5a.5.5 0 0 0-.5.5v12a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5v-12a.5.5 0 0 0-.5-.5h-1.632l.11-.35A.5.5 0 0 0 10.5 1zm.68 1h3.64l-.313 1H6.493zM11 7H5V6h6zm0 2.5H5v-1h6zM5 12h4v-1H5z" clip-rule="evenodd" /></svg>`,
    },
    {
      name: "Student Management",
      href: "/employee/students",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24"><path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4s-4 1.79-4 4s1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`,
    },
    {
      name: "Profile Settings",
      href: "/employee/profile",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24"><path fill="currentColor" d="m9.25 22l-.4-3.2q-.325-.125-.612-.3t-.563-.375L4.7 19.375l-2.75-4.75l2.575-1.95Q4.5 12.5 4.5 12.338v-.675q0-.163.025-.338L1.95 9.375l2.75-4.75l2.975 1.25q.275-.2.575-.375t.6-.3l.4-3.2h5.5l.4 3.2q.325.125.613.3t.562.375l2.975-1.25l2.75 4.75l-2.575 1.95q.025.175.025.338v.674q0 .163-.05.338l2.575 1.95l-2.75 4.75l-2.95-1.25q-.275.2-.575.375t-.6.3l-.4 3.2z" /></svg>`,
    },
    {
      name: "Sign Out",
      href: "/signout",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24"><path fill="currentColor" d="M17 2H7C5.3 2 4 3.3 4 5v6h8.6l-2.3-2.3c-.4-.4-.4-1 0-1.4s1-.4 1.4 0l4 4c.4.4.4 1 0 1.4l-4 4c-.4.4-1 .4-1.4 0s-.4-1 0-1.4l2.3-2.3H4v6c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3V5c0-1.7-1.3-3-3-3" /></svg>`,
    },
  ];

  let navItemElements = []; 
  let currentAnimatingHref = $page.url.pathname; 
  let isPageLoading = false; 
  let initialMountDone = false;
  
  const sliderAnimationSpeed = 300;
  const sliderProps = tweened(
    { top: 0, height: 0, opacity: 0 },
    { duration: sliderAnimationSpeed, easing: cubicOut }
  );

  function updateSliderPosition(targetHref, animate = true) {
    if (typeof window === 'undefined' || !navigation.length) {
      sliderProps.set({ top: 0, height: 0, opacity: 0 }, { duration: 0 });
      return;
    }
    
    const itemIndex = navigation.findIndex(item => item.href === targetHref);
    if (itemIndex !== -1 && navItemElements[itemIndex]?.isConnected) {
      const buttonElement = navItemElements[itemIndex];
      sliderProps.set({ 
        top: buttonElement.offsetTop, 
        height: buttonElement.offsetHeight, 
        opacity: 1 
      }, { 
        duration: (animate && initialMountDone) ? sliderAnimationSpeed : 0 
      });
    } else {
      sliderProps.set({ ...$sliderProps, opacity: 0 }, { 
        duration: (animate && initialMountDone) ? sliderAnimationSpeed : 0 
      });
    }
  }
  
  onMount(async () => {
    currentAnimatingHref = $page.url.pathname;
    await tick();
    initialMountDone = true;
  });

  $: if (typeof window !== 'undefined' && navigation.length !== navItemElements.length) {
    navItemElements = Array(navigation.length).fill(null);
  }

  $: if (typeof window !== 'undefined' && currentAnimatingHref && navigation.length) {
    Promise.resolve().then(() => updateSliderPosition(currentAnimatingHref, true));
  }

  $: if (typeof window !== 'undefined' && $page.url.pathname) {
    if (isPageLoading && currentAnimatingHref === $page.url.pathname) {
      isPageLoading = false;
    } else if (!isPageLoading && currentAnimatingHref !== $page.url.pathname) {
      currentAnimatingHref = $page.url.pathname;
    }
  }

  async function handleNavigation(path) {
    if (path === $page.url.pathname || isPageLoading) return;

    const previousHref = currentAnimatingHref;
    currentAnimatingHref = path;
    updateSliderPosition(path, true);
    isPageLoading = true;
    
    try {
      await goto(path);
      if (window.innerWidth < 1024) showSidebar = false;
    } catch (error) {
      console.error("Navigation error:", error);
      isPageLoading = false;
      currentAnimatingHref = previousHref;
      updateSliderPosition(previousHref, true);
    }
  }
  
  let sidebarHeight;
  $: navCount = navigation.length;
  $: navItemPadding = calculateNavItemPadding(sidebarHeight, navCount);
  
  function calculateNavItemPadding(height, count) {
    if (!height || !count) return 'py-2';
    
    const availableHeight = height - 132; // header(40) + profile(64) + footer(28)
    const standardHeight = count * 36;
    
    if (standardHeight <= availableHeight) return 'py-3';
    if (count * 30 <= availableHeight) return 'py-2';
    return 'py-1';
  }
</script>

<div class="flex h-screen overflow-hidden bg-background text-foreground">
  {#if showSidebar}
    <div class="fixed inset-0 bg-black/50 z-40 lg:hidden" on:click={() => showSidebar = false}></div>
  {/if}

  {#if showProfileModal}
    <div 
      class="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
      on:click={handleClickOutside}
      transition:fade={{ duration: 150 }}
    >
      <div id="profileModal" class="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-scale">
        <div class="bg-primary text-white p-4 flex justify-between items-center">
          <h3 class="font-bold text-lg">Profile Information</h3>
          <button 
            on:click={toggleProfileModal}
            class="text-white hover:text-gray-200 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="1.5em" height="1.5em" viewBox="0 0 24 24">
              <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        
        <div class="p-5">
          <div class="flex items-center gap-4 mb-5">
            <img src={profileImage} alt="Profile" class="w-16 h-16 rounded-full object-cover border-2 border-primary" />
            <div>
              <h4 class="font-bold text-lg text-gray-800">{userName}</h4>
              <p class="text-sm text-gray-600 capitalize">
                Tailor
                {#if userProfile?.position}
                  • {userProfile.position}
                {/if}
              </p>
            </div>
          </div>
          
          <div class="space-y-3 text-gray-700">
            {#if userProfile?.contact_number}
              <div class="flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-primary mt-0.5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M19.95 21q-3.125 0-6.175-1.363t-5.55-3.862q-2.5-2.5-3.862-5.55T3 4.05q0-.45.3-.75t.75-.3H8.1q.35 0 .625.238t.325.562l.65 3.5q.05.35-.013.638T9.4 8.45L7 10.9q1.05 1.8 2.625 3.375T13.1 17l2.35-2.35q.225-.225.588-.337t.712-.063l3.45.7q.35.075.575.338T21 15.9v4.05q0 .45-.3.75t-.75.3"/>
                </svg>
                <div>
                  <p class="text-xs text-gray-500 mb-0.5">Contact Number</p>
                  <p>{userProfile.contact_number}</p>
                </div>
              </div>
            {/if}
            
            {#if userProfile?.address}
              <div class="flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-primary mt-0.5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M12 11.5A2.5 2.5 0 0 1 9.5 9A2.5 2.5 0 0 1 12 6.5A2.5 2.5 0 0 1 14.5 9a2.5 2.5 0 0 1-2.5 2.5M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7"/>
                </svg>
                <div>
                  <p class="text-xs text-gray-500 mb-0.5">Address</p>
                  <p>{userProfile.address}</p>
                </div>
              </div>
            {/if}
            
            {#if userProfile?.created_at}
              <div class="flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-primary mt-0.5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10s10-4.5 10-10S17.5 2 12 2m4.2 14.2L11 13V7h1.5v5.2l4.5 2.7l-.8 1.3Z"/>
                </svg>
                <div>
                  <p class="text-xs text-gray-500 mb-0.5">Joined</p>
                  <p>{new Date(userProfile.created_at).toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: 'numeric'})}</p>
                </div>
              </div>
            {/if}
          </div>
        </div>
        
        <div class="border-t border-gray-200 p-4 flex justify-end gap-2">
          <button 
            on:click={toggleProfileModal}
            class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  {/if}

  <aside
    class="{showSidebar ? 'fixed inset-0 z-50 w-64 translate-x-0' : 'fixed inset-0 z-50 w-64 -translate-x-full'} 
           lg:relative lg:block lg:w-64 lg:translate-x-0 bg-primary text-white transition-transform duration-200 shadow-lg"
    bind:clientHeight={sidebarHeight}
  >
    <div class="sticky top-0 h-screen flex flex-col">
      <div class="px-3 py-2 flex items-center justify-center border-b border-primary-dark">
        <h1 class="font-bold text-base tracking-tight whitespace-nowrap">SCG DRESS SHOPPE</h1>
      </div>

      <button 
        on:click={toggleProfileModal}
        class="flex items-center gap-2 py-2 px-3 w-full text-left hover:bg-white/10 transition-colors border-b border-primary-dark"
      >
        <img src={profileImage} alt="Profile" class="w-8 h-8 rounded-full object-cover border border-white/30" />
        <div class="flex-1 min-w-0">
          <h2 class="font-medium truncate text-white text-sm">{userName}</h2>
          <p class="text-xs truncate text-white/70">
            Tailor
          </p>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-white/60 flex-shrink-0" viewBox="0 0 24 24">
          <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2m1 15h-2v-6h2zm0-8h-2V7h2z"/>
        </svg>
      </button>
      
      <nav class="flex-1 overflow-y-auto py-4 relative">
        <ul class="space-y-1 px-2">
          <div 
            class="absolute left-2 right-2 rounded bg-white shadow-sm" 
            style="top: {$sliderProps.top}px; height: {$sliderProps.height}px; opacity: {$sliderProps.opacity}; z-index: 0;"
          ></div>

          {#each navigation as navItem, i (navItem.href)}
            <li>
              <button
                bind:this={navItemElements[i]}
                on:click={() => handleNavigation(navItem.href)}
                disabled={isPageLoading}
                class="w-full text-left rounded px-3 {navItemPadding}
                  flex items-center gap-2 transition-colors duration-200 relative z-[1] 
                  hover:bg-white/10 
                  {currentAnimatingHref === navItem.href ? '' : isPageLoading ? 'opacity-50' : ''}
                  {isPageLoading ? (currentAnimatingHref === navItem.href ? 'cursor-wait' : 'cursor-not-allowed') : ''}"
              >
                <span class="flex-shrink-0 {currentAnimatingHref === navItem.href ? 'text-primary' : 'text-white'}">
                  {#if isPageLoading && currentAnimatingHref === navItem.href}
                    <div class="bg-transparent border-2 border-primary border-t-gray-400 h-[1.2em] w-[1.2em] rounded-full animate-spin"></div>
                  {:else}
                    {@html navItem.icon}
                  {/if}
                </span>
                
                <span class="truncate {currentAnimatingHref === navItem.href ? 'text-primary font-medium' : 'text-white'}">{navItem.name}</span>
              </button>
            </li>
          {/each}
        </ul>
      </nav>
      
      <div class="px-3 py-2 text-[10px] opacity-70 border-t border-primary-dark">
        <div class="truncate">JOMS SCG Dress Shoppe v1.2.0</div>
      </div>
    </div>
  </aside>

  <div class="flex-1 flex flex-col lg:relative">
    <div class="lg:hidden flex items-center justify-between bg-white border-b border-gray-200 p-3 w-full shadow-sm">
      <div class="font-semibold text-primary">SCG DRESS SHOPPE</div>
      
      <div class="flex items-center">
        <button 
          on:click={() => (showSidebar = !showSidebar)}
          class="p-2 rounded-md hover:bg-gray-100 text-gray-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="1.5em" height="1.5em" viewBox="0 0 24 24">
            <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.5" d="M3 5h18M3 12h18M3 19h18"/>
          </svg>
        </button>
      </div>
    </div>

    <main class="flex-1 overflow-y-auto p-4 md:p-6">
      <div class="h-full">
        <slot />
      </div>
    </main>
  </div>
</div>

<style>
  nav button span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>