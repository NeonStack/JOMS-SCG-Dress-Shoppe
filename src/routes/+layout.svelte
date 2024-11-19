<script>
  import "../app.css";
  import { onMount } from 'svelte';
  import { initializeAuthRefresh } from '$lib/auth';
  
  onMount(() => {
    initializeAuthRefresh();
  });
</script>

<slot />
