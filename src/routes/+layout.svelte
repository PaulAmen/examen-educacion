<script lang="ts">
  import type { Snippet } from 'svelte';
  import { onMount } from 'svelte';
  import '../app.css';
  import { authStore } from '$lib/auth.svelte.js';

  let { children }: { children: Snippet } = $props();

  onMount(() => {
    authStore.inicializar();
  });
</script>

{@render children()}
