<script>
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";

  // Managing the sidebar visibility for mobile devices
  let showSidebar = false;
  const { userRole } = $page.data;

  let navigation = [
    { name: "Dashboard", href: "/admin/dashboard", icon: "🏠" },
    { name: "Student Courses", href: "/admin/course", icon: "👤" },
    { name: "Measurement Types", href: "/admin/measurement", icon: "💸" },
    {
      name: "Uniform Configuration",
      href: "/admin/uniform-configuration",
      icon: "📝",
    },
    { name: "Students", href: "/admin/students", icon: "📊" },
    { name: "Orders", href: "/admin/orders", icon: "📊" },
    {
      name: "Account Management",
      href: "/admin/account-management",
      icon: "⚙️",
    },
    { name: "Sign Out", href: "/signout", icon: "🚪" },
  ];

  let isNavigating = false;

  async function handleNavigation(path) {
    if (isNavigating) return; // Prevent multiple clicks
    
    try {
      isNavigating = true;
      await goto(path);
    } catch (error) {
      console.error('Navigation error:', error);
    } finally {
      // Reset after a delay to prevent immediate re-clicks
      setTimeout(() => {
        isNavigating = false;
      }, 1000);
    }
  }
</script>

<!-- Main container with overflow hidden -->
<div class="flex h-screen overflow-hidden bg-background text-foreground">
  <!-- Fixed Sidebar -->
  <aside
    class="{showSidebar
      ? 'fixed inset-0 z-50'
      : 'hidden'} lg:relative lg:block w-64 bg-primary text-accent-foreground"
  >
    <div class="sticky top-0 h-screen overflow-y-auto">
      <div class="p-4 font-bold text-xl">
        {#if userRole === "admin"}
          Admin Panel
        {:else if userRole === "superadmin"}
          SuperAdmin Panel
        {:else}
          JOMS Panel
        {/if}
      </div>
      <nav>
        <ul>
          {#each navigation as navItem}
            <li>
              <button
                on:click={() => handleNavigation(navItem.href)}
                disabled={isNavigating}
                class="w-full text-left block py-3 px-4 hover:bg-primary 
                {$page.url.pathname === navItem.href ? 'bg-primary' : ''}
                {isNavigating ? 'opacity-50 cursor-not-allowed' : ''}"
              >
                {#if isNavigating && $page.url.pathname === navItem.href}
                  ⌛ <!-- Loading indicator -->
                {:else}
                  {navItem.icon}
                {/if}
                {navItem.name}
              </button>
            </li>
          {/each}
        </ul>
      </nav>
    </div>
  </aside>

  <!-- Content wrapper -->
  <div class="flex-1 flex flex-col lg:relative">
    <!-- Mobile Menu Toggle -->
    <div
      class="lg:hidden flex items-center justify-between bg-primary text-accent-foreground p-4 w-full"
    >
      <div class="font-bold text-xl">
        {#if userRole === "admin"}
          Admin Panel
        {:else if userRole === "superadmin"}
          SuperAdmin Panel
        {:else}
          JOMS Panel
        {/if}
      </div>
      <button on:click={() => (showSidebar = !showSidebar)}> ☰ </button>
    </div>

    <!-- Scrollable content area -->
    <main class="flex-1 overflow-y-auto p-6">
      <slot />
    </main>
  </div>
</div>

<style>
  /* Optional: Add smooth transition for sidebar on mobile */
  aside {
    transition: transform 0.3s ease-in-out;
  }

  button:disabled {
    cursor: not-allowed;
  }
</style>
