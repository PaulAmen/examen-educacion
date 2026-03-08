<script lang="ts">
  import { examenStore } from '$lib/state/examen.svelte.js';
</script>

<div class="flex items-center gap-1.5 text-xs text-gray-500 shrink-0" title={examenStore.guardando ? 'Guardando en la nube…' : 'Guardado'}>
  {#if examenStore.guardando}
    <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
    <span class="hidden sm:inline">Guardando…</span>
  {:else}
    <span class="w-2 h-2 rounded-full bg-green-400"></span>
    <span class="hidden sm:inline text-gray-400">Guardado</span>
  {/if}
</div>
