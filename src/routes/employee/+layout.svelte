<script>
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";

  // Managing the sidebar visibility for mobile devices
  let showSidebar = false;

  let navigation = [
    { name: "Dashboard", href: "/employee/dashboard", icon: "🏠" },
    { name: "Orders", href: "/employee/orders", icon: "👤" },
    { name: "Student Information", href: "/employee/students", icon: "💸" },
    { name: "Profile Settings", href: "/employee/profile", icon: "📝" },
    { name: "Sign Out", href: "/signout", icon: "🚪" },
  ];
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
      <div class="p-4 font-bold text-xl">Tailor Panel</div>
      <nav>
        <ul>
          {#each navigation as navItem}
            <li>
              <button
                on:click={() => goto(navItem.href)}
                class="w-full text-left block py-3 px-4 hover:bg-primary {$page.url
                  .pathname === navItem.href
                  ? 'bg-primary'
                  : ''}"
              >
                {navItem.icon}
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
      <div class="font-bold text-xl">Admin Panel</div>
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
</style>