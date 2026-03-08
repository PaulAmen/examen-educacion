<script lang="ts">
  import type { Pregunta, RespuestaConRespuesta } from '$lib/state/examen.svelte.js';

  let { pregunta, indice, respuesta, onRespuesta, disabled }: {
    pregunta: Pregunta;
    indice: number;
    respuesta: RespuestaConRespuesta | undefined;
    onRespuesta: (indice: number, valor: RespuestaConRespuesta) => void;
    disabled: boolean;
  } = $props();

  // Construye las opciones desde los campos reales de la DB
  const opciones = $derived(
    [
      { letra: 'A', texto: pregunta.Opcion_A_o_Concepto1 },
      { letra: 'B', texto: pregunta.Opcion_B_o_Definicion1 },
      { letra: 'C', texto: pregunta.Opcion_C_o_Concepto2 },
      { letra: 'D', texto: pregunta.Opcion_D_o_Definicion2 }
    ].filter(o => Boolean(o.texto))
  );

  function seleccionar(letra: string) {
    // Preservar justificación si ya existe (en caso de que se cambie la opción)
    onRespuesta(indice, { ...respuesta, respuesta: letra });
  }

  function actualizarJustificacion(texto: string) {
    onRespuesta(indice, { ...respuesta, justificacion: texto });
  }

  // Casos de Uso: la justificación siempre es visible y vale 30% de los puntos
  const esCasoDeUso = $derived(pregunta.Tipo_Pregunta === 'Casos de Uso');
</script>

<div class="space-y-3">
  <fieldset {disabled} class="space-y-2 border-none p-0">
    <legend class="sr-only">Selecciona una opción</legend>
    {#each opciones as opcion}
      <label
        class={[
          'flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all',
          respuesta?.respuesta === opcion.letra
            ? 'border-blue-600 bg-blue-50'
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
          disabled ? 'opacity-60 cursor-not-allowed pointer-events-none' : 'cursor-pointer'
        ].join(' ')}
      >
        <input
          type="radio"
          name="pregunta-{indice}"
          value={opcion.letra}
          checked={respuesta?.respuesta === opcion.letra}
          onchange={() => seleccionar(opcion.letra)}
          {disabled}
          class="sr-only"
        />
        <span
          class={[
            'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors',
            respuesta?.respuesta === opcion.letra
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-600'
          ].join(' ')}
        >
          {opcion.letra}
        </span>
        <span class="text-sm text-gray-800 leading-relaxed">{opcion.texto}</span>
      </label>
    {/each}
  </fieldset>

  {#if esCasoDeUso}
    <div class="mt-3 bg-gray-50 border border-gray-200 rounded-xl p-4">
      <label for="just-{indice}" class="block text-sm font-semibold text-gray-700 mb-2">
        Justifica tu respuesta
        <span class="font-normal text-gray-500 text-xs ml-1">(requerido para puntaje completo)</span>
      </label>
      <textarea
        id="just-{indice}"
        value={respuesta?.justificacion ?? ''}
        oninput={(e) => actualizarJustificacion(e.currentTarget.value)}
        {disabled}
        rows="4"
        placeholder="Explica por qué seleccionaste esa opción y en qué se basa tu razonamiento…"
        class={[
          'w-full rounded-lg border border-gray-300 p-3 text-sm leading-relaxed font-[inherit]',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y',
          disabled ? 'bg-gray-100 cursor-not-allowed opacity-70' : 'bg-white'
        ].join(' ')}
      ></textarea>
    </div>
  {/if}
</div>
