<script>
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { onMount, tick } from "svelte";
  import { fade } from "svelte/transition";
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';

  let showSidebar = false;
  const { userRole, userProfile, permissions = $page.data.permissions || [] } = $page.data;
  
  let showProfileModal = false;
  let isEditingProfile = false;

  let profileImage = userProfile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent((userProfile?.first_name?.[0] || "") + (userProfile?.last_name?.[0] || ""))}&background=B73233&color=fff`;
  
  $: userName = userProfile ? `${userProfile.first_name} ${userProfile.last_name}` : (userRole === "superadmin" ? "Super Administrator" : "Administrator");
  $: canEditProfile = userRole === 'superadmin' || permissions.includes('/admin/account-management');

  function toggleProfileModal() {
    showProfileModal = !showProfileModal;
  }

  async function editProfile() {
    try {
      isEditingProfile = true;
      await goto("/admin/account-management?tab=admins");
      showProfileModal = false;
    } catch (error) {
      console.error("Navigation error:", error);
    } finally {
      isEditingProfile = false;
    }
  }

  function handleClickOutside(event) {
    const modal = document.getElementById('profileModal');
    if (modal && !modal.contains(event.target) && !isEditingProfile) {
      showProfileModal = false;
    }
  }

  const fullNavigationList = [
    {
      name: "Dashboard",
      href: "/admin/dashboard",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24"><path fill="currentColor" d="M3 13h8V3H3zm0 8h8v-6H3zm10 0h8V11h-8zm0-18v6h8V3z" /></svg>`,
    },
    {
      name: "Tailor Performance",
      href: "/admin/tailor-performance",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24"><path fill="currentColor" d="M3 22V8h4v14zm7 0V2h4v20zm7 0v-8h4v8z" /></svg>`,
    },
    {
      name: "Student Courses",
      href: "/admin/course",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24"><path fill="currentColor" d="M3 23h18V1H3zM14.002 6.688L11.504 8.75V3H16.5v5.75z" /></svg>`,
    },
    {
      name: "Measurement Types",
      href: "/admin/measurement",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24"><path fill="currentColor" d="M18 1H6v5h3.5v2H6v3h5v2H6v3h3.5v2H6v5h12z" /></svg>`,
    },
    {
      name: "Uniform Configuration",
      href: "/admin/uniform-configuration",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 512 512"><path fill="currentColor" fill-rule="evenodd" d="m234.67 85.33l-.004 213.338h-21.333v42.666h21.333l.005 85.33h42.666l-.004-85.33h21.333v-42.666h-21.333l.004-213.338zm-128.006 0v85.355H85.331v42.645h21.333v213.333h42.667V213.33h21.333v-42.645h-21.333V85.33zm255.981.004v128h-21.333l.013 42.663h21.333v170.666h42.688V255.997h21.333l-.013-42.663h-21.333l.013-128.004z" /></svg>`,
    },
    {
      name: "Student Management",
      href: "/admin/students",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24"><path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4s-4 1.79-4 4s1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`,
    },
    {
      name: "Orders Management",
      href: "/admin/orders",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 16 16"><path fill="currentColor" fill-rule="evenodd" d="M5.5 1a.5.5 0 0 0-.477.65l.11.35H3.5a.5.5 0 0 0-.5.5v12a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5v-12a.5.5 0 0 0-.5-.5h-1.632l.11-.35A.5.5 0 0 0 10.5 1zm.68 1h3.64l-.313 1H6.493zM11 7H5V6h6zm0 2.5H5v-1h6zM5 12h4v-1H5z" clip-rule="evenodd" /></svg>`,
    },
    {
      name: "Account Management",
      href: "/admin/account-management",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24"><path fill="currentColor" d="M11 10v2H9v2H7v-2H5.8c-.4 1.2-1.5 2-2.8 2c-1.7 0-3-1.3-3-3s1.3-3 3-3c1.3 0 2.4.8 2.8 2zm-8 0c-.6 0-1 .4-1 1s.4 1 1 1s1-.4 1-1s-.4-1-1-1m13 4c2.7 0 8 1.3 8 4v2H8v-2c0-2.7 5.3-4 8-4m0-2c-2.2 0-4-1.8-4-4s1.8-4 4-4s4 1.8 4 4s-1.8 4-4 4" /></svg>`,
    },
    {
      name: "Sign Out",
      href: "/signout",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24"><path fill="currentColor" d="M17 2H7C5.3 2 4 3.3 4 5v6h8.6l-2.3-2.3c-.4-.4-.4-1 0-1.4s1-.4 1.4 0l4 4c.4.4.4 1 0 1.4l-4 4c-.4.4-1 .4-1.4 0s-.4-1 0-1.4l2.3-2.3H4v6c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3V5c0-1.7-1.3-3-3-3" /></svg>`,
    },
  ];
  
  let navigation = [];

  $: {
    let tempNav = [...fullNavigationList];
    if (userRole === 'superadmin') {
      const adminPermissionsItem = {
        name: "Admin Permissions",
        href: "/admin/permissions",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24"><path fill="currentColor" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12c5.16-1.26 9-6.45 9-12V5zm0 11h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>`
      };
      const signOutIndex = tempNav.findIndex(item => item.href === '/signout');
      if (signOutIndex !== -1) {
        tempNav.splice(signOutIndex, 0, adminPermissionsItem);
      } else {
        tempNav.push(adminPermissionsItem);
      }
      navigation = tempNav;
    } else if (userRole === 'admin') {
      navigation = fullNavigationList.filter(item => 
        item.href === '/admin/dashboard' ||
        item.href === '/signout' ||
        permissions.includes(item.href)
      );
    } else {
      navigation = tempNav;
    }
  }

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
            disabled={isEditingProfile}
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
                {userRole === 'superadmin' ? 'Super Admin' : userRole}
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
            disabled={isEditingProfile}
          >
            Close
          </button>
          
          {#if canEditProfile}
            <button 
              on:click={editProfile}
              disabled={isEditingProfile}
              class="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors flex items-center gap-2 relative {isEditingProfile ? 'opacity-80' : ''}"
            >
              {#if isEditingProfile}
                <svg xmlns="http://www.w3.org/2000/svg" class="animate-spin absolute left-4" width="1.2em" height="1.2em" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M12 2A10 10 0 1 0 22 12A10 10 0 0 0 12 2Zm0 18a8 8 0 1 1 8-8A8 8 0 0 1 12 20Z" opacity=".5"/>
                  <path fill="currentColor" d="M20 12h2A10 10 0 0 0 12 2V4A8 8 0 0 1 20 12Z"/>
                </svg>
                <span class="ml-6">Navigating...</span>
              {:else}
                <svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M5 19h1.425L16.2 9.225L14.775 7.8L5 17.575zm-2 2v-4.25L15.75 4.125q.275-.275.688-.288t.712.288l1.75 1.75q.3.3.3.7t-.3.7L6.25 21zm16.6-11.5L17 7.875L18.125 9z"/>
                </svg>
                <span>Edit Profile</span>
              {/if}
            </button>
          {/if}
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
            {userRole === 'superadmin' ? 'Super Admin' : userRole}
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
