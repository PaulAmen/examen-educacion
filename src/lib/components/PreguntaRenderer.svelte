<script lang="ts">
  import type { Pregunta, RespuestaValor, RespuestaConRespuesta, RespuestaUnir } from '$lib/state/examen.svelte.js';
  import PreguntaOpcionMultiple from './PreguntaOpcionMultiple.svelte';
  import PreguntaVerdaderoFalso from './PreguntaVerdaderoFalso.svelte';
  import PreguntaUnirLineas from './PreguntaUnirLineas.svelte';

  let { pregunta, indice, respuesta, onRespuesta, disabled }: {
    pregunta: Pregunta;
    indice: number;
    respuesta: RespuestaValor | undefined;
    onRespuesta: (indice: number, valor: RespuestaValor) => void;
    disabled: boolean;
  } = $props();

  // Determina si la pregunta tiene respuesta registrada (para el indicador visual)
  const respondida = $derived(() => {
    if (!respuesta || typeof respuesta !== 'object') return false;
    if ('respuesta' in respuesta) {
      const r = respuesta as RespuestaConRespuesta;
      return Boolean(r.respuesta);
    }
    const r = respuesta as RespuestaUnir;
    return Object.keys(r).length > 0;
  });

  const esOpcionMultiple = $derived(
    pregunta.Tipo_Pregunta === 'Opción Múltiple' || pregunta.Tipo_Pregunta === 'Casos de Uso'
  );
</script>

<article
  id="pregunta-{indice}"
  class={[
    'card transition-all duration-300 border-2',
    respondida() ? 'border-brand-green/20 bg-brand-green/[0.02]' : 'border-slate-100 hover:border-slate-200'
  ].join(' ')}
>
  <!-- Cabecera -->
  <header class="flex items-start gap-4 px-6 pt-6 pb-4">
    <div
      class={[
        'shrink-0 w-10 h-10 rounded-2xl text-sm font-black flex items-center justify-center transition-all duration-500 shadow-sm',
        respondida() ? 'bg-brand-green text-white rotate-[360deg]' : 'bg-slate-900 text-white'
      ].join(' ')}
    >
      {indice + 1}
    </div>

    <div class="flex-1 min-w-0">
      <div class="flex flex-wrap items-center gap-2 mb-2">
        <span class="text-[10px] font-black text-brand-red bg-brand-red/5 px-2.5 py-1 rounded-md uppercase tracking-widest border border-brand-red/10">
          {pregunta.Tipo_Pregunta}
        </span>
        {#if pregunta.Materia}
          <span class="text-[10px] text-slate-400 font-black uppercase tracking-widest">{pregunta.Materia}</span>
        {/if}
        {#if pregunta.Tema}
          <span class="text-[10px] text-slate-300 font-bold">/ {pregunta.Tema}</span>
        {/if}
      </div>
      <p class="text-slate-900 font-bold leading-relaxed text-base sm:text-lg tracking-tight">
        {pregunta.Enunciado}
      </p>
    </div>
  </header>

  <!-- Cuerpo con el componente de respuesta -->
  <div class="px-6 pb-6">
    {#if esOpcionMultiple}
      <PreguntaOpcionMultiple
        {pregunta}
        {indice}
        respuesta={respuesta as RespuestaConRespuesta | undefined}
        {onRespuesta}
        {disabled}
      />
    {:else if pregunta.Tipo_Pregunta === 'Verdadero o Falso'}
      <PreguntaVerdaderoFalso
        {pregunta}
        {indice}
        respuesta={respuesta as RespuestaConRespuesta | undefined}
        {onRespuesta}
        {disabled}
      />
    {:else if pregunta.Tipo_Pregunta === 'Unir con Líneas'}
      <PreguntaUnirLineas
        {pregunta}
        {indice}
        respuesta={respuesta as RespuestaUnir | undefined}
        {onRespuesta}
        {disabled}
      />
    {/if}
  </div>

  {#if respondida()}
    <div class="bg-brand-green/10 py-1.5 px-6 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
      <svg class="w-3 h-3 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="4"><path d="M5 13l4 4L19 7"/></svg>
      <span class="text-[10px] font-black text-brand-green uppercase tracking-[0.2em]">Respuesta registrada</span>
    </div>
  {/if}
</article>
