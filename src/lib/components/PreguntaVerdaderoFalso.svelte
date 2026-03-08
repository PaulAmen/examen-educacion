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
    // Preservar justificación existente al cambiar la selección
    onRespuesta(indice, { ...respuesta, respuesta: valor });
  }

  function actualizarJustificacion(texto: string) {
    onRespuesta(indice, { ...respuesta, justificacion: texto });
  }
</script>

<div class="space-y-4">
  <!-- Botones Verdadero / Falso -->
  <div class="grid grid-cols-2 gap-3" role="group" aria-label="Verdadero o Falso">
    {#each ['Verdadero', 'Falso'] as opcion}
      <button
        onclick={() => seleccionar(opcion as 'Verdadero' | 'Falso')}
        {disabled}
        aria-pressed={respuesta?.respuesta === opcion}
        class={[
          'py-4 rounded-xl font-bold text-sm tracking-wide transition-all border-2',
          respuesta?.respuesta === opcion
            ? opcion === 'Verdadero'
              ? 'bg-green-600 border-green-600 text-white shadow-sm'
              : 'bg-red-600 border-red-600 text-white shadow-sm'
            : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400',
          disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
        ].join(' ')}
      >
        {opcion}
      </button>
    {/each}
  </div>

  <!-- Textarea de justificación: SIEMPRE visible (vale 30% del puntaje) -->
  <div class="bg-gray-50 border border-gray-200 rounded-xl p-4">
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
      placeholder="Explica por qué la afirmación es verdadera o falsa, con argumentos del tema…"
      class={[
        'w-full rounded-lg border border-gray-300 p-3 text-sm leading-relaxed font-[inherit]',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y',
        disabled ? 'bg-gray-100 cursor-not-allowed opacity-70' : 'bg-white'
      ].join(' ')}
    ></textarea>
  </div>
</div>
