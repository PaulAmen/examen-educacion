<script lang="ts">
  import type { Pregunta, RespuestaUnir } from '$lib/state/examen.svelte.js';

  let { pregunta, indice, respuesta, onRespuesta, disabled }: {
    pregunta: Pregunta;
    indice: number;
    respuesta: RespuestaUnir | undefined;
    onRespuesta: (indice: number, valor: RespuestaUnir) => void;
    disabled: boolean;
  } = $props();

  // Conceptos: clave = "Concepto1".."Concepto4" (compatible con calificar.js)
  // El valor es el texto del concepto extraído de los campos reales de la DB.
  const conceptos = $derived(
    [
      { clave: 'Concepto1', texto: pregunta.Opcion_A_o_Concepto1 },
      { clave: 'Concepto2', texto: pregunta.Opcion_C_o_Concepto2 },
      { clave: 'Concepto3', texto: pregunta.Concepto3 },
      { clave: 'Concepto4', texto: pregunta.Concepto4 }
    ].filter(c => Boolean(c.texto)) as { clave: string; texto: string }[]
  );

  // Definiciones disponibles: extraídas de los campos de definición
  const definiciones = $derived(
    [
      pregunta.Opcion_B_o_Definicion1,
      pregunta.Opcion_D_o_Definicion2,
      pregunta.Definicion3,
      pregunta.Definicion4
    ].filter(Boolean) as string[]
  );

  const emparejados = $derived(
    conceptos.filter(c => !!(respuesta ?? {})[c.clave]).length
  );

  function seleccionarDefinicion(clave: string, definicion: string) {
    const actualizado: RespuestaUnir = { ...(respuesta ?? {}) };
    if (definicion === '') {
      delete actualizado[clave];
    } else {
      actualizado[clave] = definicion;
    }
    onRespuesta(indice, actualizado);
  }
</script>

<div class="space-y-3">
  <p class="text-xs text-gray-500">
    Selecciona la definición correspondiente a cada concepto
    <span class="ml-2 font-medium text-blue-600">({emparejados}/{conceptos.length} emparejados)</span>
  </p>

  {#each conceptos as concepto}
    {@const valorSeleccionado = (respuesta ?? {})[concepto.clave] ?? ''}
    <div class="flex flex-col sm:flex-row sm:items-center gap-2">
      <!-- Concepto -->
      <div class={[
        'flex-1 text-sm font-medium px-3 py-2.5 rounded-xl border',
        valorSeleccionado
          ? 'bg-blue-50 text-blue-800 border-blue-200'
          : 'bg-gray-100 text-gray-700 border-gray-200'
      ].join(' ')}>
        {concepto.texto}
      </div>

      <!-- Flecha (solo desktop) -->
      <svg class="hidden sm:block w-5 h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/>
      </svg>

      <!-- Selector de definición -->
      <select
        value={valorSeleccionado}
        onchange={(e) => seleccionarDefinicion(concepto.clave, e.currentTarget.value)}
        {disabled}
        aria-label="Definición para {concepto.texto}"
        class={[
          'flex-1 rounded-xl border px-3 py-2.5 text-sm',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition',
          valorSeleccionado
            ? 'border-blue-300 bg-blue-50 text-blue-800'
            : 'border-gray-300 bg-white text-gray-500',
          disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
        ].join(' ')}
      >
        <option value="">— Seleccionar —</option>
        {#each definiciones as def}
          <option value={def}>{def}</option>
        {/each}
      </select>
    </div>
  {/each}
</div>
