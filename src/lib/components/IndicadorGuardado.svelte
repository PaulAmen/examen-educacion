<script lang="ts">
  import { examenStore } from '$lib/state/examen.svelte.js';
</script>

<div class="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shrink-0" title={examenStore.guardando ? 'Sincronizando con el servidor…' : 'Sincronizado'}>
  {#if examenStore.guardando}
    <div class="relative flex h-2 w-2">
      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-orange opacity-75"></span>
      <span class="relative inline-flex rounded-full h-2 w-2 bg-brand-orange"></span>
    </div>
    <span class="hidden sm:inline text-brand-orange animate-pulse">Guardando</span>
  {:else}
    <div class="h-2 w-2 rounded-full bg-brand-green shadow-[0_0_5px_rgba(2,89,24,0.5)]"></div>
    <span class="hidden sm:inline text-slate-400">Sincronizado</span>
  {/if}
</div>
