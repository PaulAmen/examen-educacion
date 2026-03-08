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
    // Al seleccionar Verdadero, limpiar justificación (no aplica)
    const justificacion = valor === 'Verdadero' ? undefined : (respuesta?.justificacion ?? '');
    onRespuesta(indice, { respuesta: valor, justificacion });
  }

  function actualizarJustificacion(texto: string) {
    onRespuesta(indice, { ...respuesta, justificacion: texto });
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

  <!-- Justificación: solo visible cuando la respuesta es Falso -->
  {#if respuesta?.respuesta === 'Falso'}
    <div class={[
      'rounded-2xl p-5 transition-all duration-500 border-2',
      respuesta?.justificacion && respuesta.justificacion.length > 10
        ? 'bg-brand-green/[0.02] border-brand-green/10'
        : 'bg-brand-gray border-slate-100'
    ].join(' ')}>
      <label for="just-{indice}" class="flex items-center justify-between mb-3">
        <span class="text-[10px] font-black text-slate-500 uppercase tracking-widest">¿Por qué es falso?</span>
        <span class="text-[9px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-100 uppercase tracking-tighter">Requerido para puntaje completo</span>
      </label>
      <textarea
        id="just-{indice}"
        value={respuesta?.justificacion ?? ''}
        oninput={(e) => actualizarJustificacion(e.currentTarget.value)}
        {disabled}
        rows="4"
        placeholder="Explica por qué la afirmación es falsa con argumentos técnicos o conceptuales…"
        class={[
          'w-full rounded-xl border-2 border-slate-200 p-4 text-sm leading-relaxed font-bold text-slate-700 tracking-tight',
          'focus:outline-none focus:border-brand-red focus:ring-4 focus:ring-brand-red/5 resize-y transition-all',
          disabled ? 'bg-slate-50 cursor-not-allowed opacity-50' : 'bg-white'
        ].join(' ')}
      ></textarea>
      <div class="mt-2 flex justify-end">
        <span class={[
          'text-[9px] font-black uppercase tracking-widest',
          (respuesta?.justificacion?.length ?? 0) > 10 ? 'text-brand-green' : 'text-slate-300'
        ].join(' ')}>
          {(respuesta?.justificacion?.length ?? 0)} caracteres
        </span>
      </div>
    </div>
  {/if}
</div>
