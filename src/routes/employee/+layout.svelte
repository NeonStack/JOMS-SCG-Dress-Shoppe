<script>
    import { page } from '$app/stores';
  
    let showSidebar = false;
  
    let employeeNavigation = [
      { name: 'Dashboard', href: '/employee/dashboard', icon: '🏠' },
      { name: 'Task Management', href: '/employee/tasks', icon: '🛠' },
      { name: 'Job Orders', href: '/employee/orders', icon: '📝' },
      { name: 'Profile', href: '/employee/profile', icon: '👤' }
    ];
  </script>
  
  <!-- Main container that holds the sidebar and the content -->
  <div class="flex h-screen bg-background text-foreground">
    <!-- Sidebar (hidden on mobile, visible on larger screens) -->
    <aside class="{showSidebar ? 'block' : 'hidden'} lg:block w-64 bg-primary text-accent-foreground">
      <div class="p-4 font-bold text-xl">Employee Panel</div>
      <nav>
        <ul>
          {#each employeeNavigation as navItem}
            <li>
              <a
                href={navItem.href}
                class="block py-3 px-4 hover:bg-primary-dark {$page.url.pathname === navItem.href ? 'bg-primary-dark' : ''}"
              >
                {navItem.icon} {navItem.name}
              </a>
            </li>
          {/each}
        </ul>
      </nav>
    </aside>
  
    <!-- Mobile Menu Toggle (Visible on mobile screens) -->
    <div class="lg:hidden flex items-center justify-between bg-primary text-accent-foreground p-4 w-full">
      <div class="font-bold text-xl">Employee Panel</div>
      <button on:click={() => showSidebar = !showSidebar}>
        <!-- Hamburger Icon -->
        ☰
      </button>
    </div>
  
    <!-- Main content area -->
    <div class="flex-1 p-6">
      <slot />
    </div>
  </div>
  
  <style>
    /* Responsive styles, if needed */
  </style>
  