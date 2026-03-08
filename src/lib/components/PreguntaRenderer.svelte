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
    if ('respuesta' in respuesta) return Boolean(respuesta.respuesta);
    return Object.keys(respuesta).length > 0;
  });

  const esOpcionMultiple = $derived(
    pregunta.Tipo_Pregunta === 'Opción Múltiple' || pregunta.Tipo_Pregunta === 'Casos de Uso'
  );
</script>

<article
  id="pregunta-{indice}"
  class={[
    'bg-white rounded-2xl border-2 shadow-sm overflow-hidden transition-all',
    respondida() ? 'border-green-200' : 'border-gray-200'
  ].join(' ')}
>
  <!-- Cabecera -->
  <header class="flex items-start gap-3 px-5 pt-5 pb-4">
    <span
      class={[
        'flex-shrink-0 w-9 h-9 rounded-full text-sm font-bold flex items-center justify-center',
        respondida() ? 'bg-green-500 text-white' : 'bg-blue-600 text-white'
      ].join(' ')}
    >
      {indice + 1}
    </span>

    <div class="flex-1 min-w-0">
      <div class="flex flex-wrap items-center gap-2 mb-1">
        <span class="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full">
          {pregunta.Tipo_Pregunta}
        </span>
        {#if pregunta.Materia}
          <span class="text-xs text-gray-500 font-semibold">{pregunta.Materia}</span>
        {/if}
        {#if pregunta.Tema}
          <span class="text-xs text-gray-400">· {pregunta.Tema}</span>
        {/if}
      </div>
      <p class="text-gray-900 font-medium leading-relaxed text-sm sm:text-base">
        {pregunta.Enunciado}
      </p>
    </div>
  </header>

  <!-- Cuerpo con el componente de respuesta -->
  <div class="px-5 pb-5">
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
</article>
