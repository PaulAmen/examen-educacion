<script lang="ts">
  import type { Pregunta, RespuestaConRespuesta } from '$lib/state/examen.svelte.js';

  let { pregunta, indice, respuesta, onRespuesta, disabled }: {
    pregunta: Pregunta;
    indice: number;
    respuesta: RespuestaConRespuesta | undefined;
    onRespuesta: (indice: number, valor: RespuestaConRespuesta) => void;
    disabled: boolean;
  } = $props();

  // Shuffle determinista con djb2 + LCG para buena distribución
  function shuffleConSemilla<T>(arr: T[], semilla: string): T[] {
    // djb2 hash de la semilla
    let seed = 5381;
    for (let i = 0; i < semilla.length; i++) {
      seed = (((seed << 5) + seed) + semilla.charCodeAt(i)) | 0;
    }
    // LCG (Linear Congruential Generator)
    const rand = () => {
      seed = (Math.imul(1664525, seed) + 1013904223) | 0;
      return (seed >>> 0) / 0x100000000;
    };
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  // Construye las opciones desde los campos reales de la DB y las revuelve
  const opciones = $derived(
    shuffleConSemilla(
      [
        { letra: 'A', texto: pregunta.Opcion_A_o_Concepto1 },
        { letra: 'B', texto: pregunta.Opcion_B_o_Definicion1 },
        { letra: 'C', texto: pregunta.Opcion_C_o_Concepto2 },
        { letra: 'D', texto: pregunta.Opcion_D_o_Definicion2 }
      ].filter(o => Boolean(o.texto)),
      pregunta.ID_Pregunta
    )
  );

  function seleccionar(letra: string) {
    onRespuesta(indice, { ...respuesta, respuesta: letra });
  }

</script>

<div class="space-y-4">
  <fieldset {disabled} class="grid gap-3 border-none p-0">
    <legend class="sr-only">Selecciona una opción</legend>
    {#each opciones as opcion}
      <label
        class={[
          'group relative flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-300 shadow-sm active:scale-[0.98]',
          respuesta?.respuesta === opcion.letra
            ? 'border-brand-green bg-brand-green/[0.03] shadow-brand-green/10'
            : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50',
          disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'cursor-pointer'
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
            'w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shrink-0 transition-all duration-500',
            respuesta?.respuesta === opcion.letra
              ? 'bg-brand-green text-white shadow-lg shadow-brand-green/20 rotate-[360deg]'
              : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
          ].join(' ')}
        >
          {opcion.letra}
        </span>
        
        <span class="text-sm sm:text-base text-slate-700 font-bold leading-snug flex-1">
          {opcion.texto}
        </span>

        {#if respuesta?.respuesta === opcion.letra}
          <div class="absolute right-4 text-brand-green animate-in zoom-in duration-300">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        {/if}
      </label>
    {/each}
  </fieldset>
</div>
