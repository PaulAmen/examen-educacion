<script lang="ts">
  import type { Pregunta, RespuestaConRespuesta } from '$lib/state/examen.svelte.js';

  let { pregunta, indice, respuesta, onRespuesta, disabled }: {
    pregunta: Pregunta;
    indice: number;
    respuesta: RespuestaConRespuesta | undefined;
    onRespuesta: (indice: number, valor: RespuestaConRespuesta) => void;
    disabled: boolean;
  } = $props();

  function seleccionar(valor: 'Verdadero' | 'Falso') {
    onRespuesta(indice, { respuesta: valor });
  }
</script>

<div class="space-y-6">
  <!-- Botones Verdadero / Falso -->
  <div class="grid grid-cols-2 gap-4" role="group" aria-label="Verdadero o Falso">
    {#each ['Verdadero', 'Falso'] as opcion}
      <button
        onclick={() => seleccionar(opcion as 'Verdadero' | 'Falso')}
        {disabled}
        aria-pressed={respuesta?.respuesta === opcion}
        class={[
          'group relative py-5 rounded-2xl font-black text-xs tracking-[0.2em] uppercase transition-all duration-300 border-2 shadow-sm active:scale-[0.98]',
          respuesta?.respuesta === opcion
            ? opcion === 'Verdadero'
              ? 'bg-brand-green border-brand-green text-white shadow-brand-green/20'
              : 'bg-brand-red border-brand-red text-white shadow-brand-red/20'
            : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300 hover:text-slate-600',
          disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
        ].join(' ')}
      >
        <div class="flex items-center justify-center gap-2">
          {#if respuesta?.respuesta === opcion}
            <svg class="w-4 h-4 animate-in zoom-in duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          {/if}
          {opcion}
        </div>
      </button>
    {/each}
  </div>

</div>
