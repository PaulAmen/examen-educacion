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

</div>
