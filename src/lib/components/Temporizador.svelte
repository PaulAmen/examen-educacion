<script lang="ts">
  import { examenStore } from '$lib/state/examen.svelte.js';

  // Alerta cuando quedan menos de 5 minutos
  const urgente = $derived(
    examenStore.tiempoRestante > 0 && examenStore.tiempoRestante < 300
  );
  const critico = $derived(
    examenStore.tiempoRestante > 0 && examenStore.tiempoRestante < 60
  );
</script>

{#if examenStore.horaCierre}
  <div
    class={[
      'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-mono font-bold tabular-nums transition-colors',
      critico
        ? 'bg-red-600 text-white animate-pulse'
        : urgente
          ? 'bg-orange-100 text-orange-700'
          : 'bg-blue-100 text-blue-700'
    ].join(' ')}
    title="Tiempo restante"
  >
    <!-- Ícono reloj -->
    <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
    {examenStore.tiempoFormateado}
  </div>
{/if}
