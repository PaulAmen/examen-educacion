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
      'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black tracking-widest tabular-nums transition-all duration-500 shadow-sm border',
      critico
        ? 'bg-brand-red text-white border-brand-red animate-[pulse_0.5s_infinite]'
        : urgente
          ? 'bg-brand-orange/10 text-brand-orange border-brand-orange/20'
          : 'bg-brand-gray text-slate-700 border-slate-200'
    ].join(' ')}
    title="Tiempo restante"
  >
    <!-- Ícono reloj -->
    <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
    <span class="font-mono">{examenStore.tiempoFormateado}</span>
  </div>
{/if}
