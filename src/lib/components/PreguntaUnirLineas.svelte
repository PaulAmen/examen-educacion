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
  const conceptos = $derived(
    [
      { clave: 'Concepto1', texto: pregunta.Opcion_A_o_Concepto1 },
      { clave: 'Concepto2', texto: pregunta.Opcion_C_o_Concepto2 },
      { clave: 'Concepto3', texto: pregunta.Concepto3 },
      { clave: 'Concepto4', texto: pregunta.Concepto4 }
    ].filter(c => Boolean(c.texto)) as { clave: string; texto: string }[]
  );

  function shuffleConSemilla<T>(arr: T[], semilla: string): T[] {
    let seed = 5381;
    for (let i = 0; i < semilla.length; i++) {
      seed = (((seed << 5) + seed) + semilla.charCodeAt(i)) | 0;
    }
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

  // Definiciones revueltas de forma determinista por pregunta
  const definiciones = $derived(
    shuffleConSemilla(
      [
        pregunta.Opcion_B_o_Definicion1,
        pregunta.Opcion_D_o_Definicion2,
        pregunta.Definicion3,
        pregunta.Definicion4
      ].filter(Boolean) as string[],
      pregunta.ID_Pregunta
    )
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

<div class="space-y-4">
  <div class="flex items-center justify-between mb-2">
    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">
      Empareja los conceptos con su definición
    </p>
    <span class={[
      'text-[10px] font-black px-2 py-0.5 rounded-md border uppercase tracking-tighter',
      emparejados === conceptos.length
        ? 'bg-brand-green/10 text-brand-green border-brand-green/20'
        : 'bg-slate-100 text-slate-400 border-slate-200'
    ].join(' ')}>
      {emparejados} / {conceptos.length} listos
    </span>
  </div>

  <div class="grid gap-3">
    {#each conceptos as concepto}
      {@const valorSeleccionado = (respuesta ?? {})[concepto.clave] ?? ''}
      <div class="group flex flex-col sm:flex-row sm:items-stretch gap-0 sm:gap-2">
        <!-- Concepto -->
        <div class={[
          'flex-1 text-sm font-bold px-4 py-3 rounded-t-2xl sm:rounded-2xl border-2 transition-all duration-300 flex items-center',
          valorSeleccionado
            ? 'bg-brand-green/[0.03] text-brand-green border-brand-green/20'
            : 'bg-white text-slate-700 border-slate-100 group-hover:border-slate-300'
        ].join(' ')}>
          {concepto.texto}
        </div>

        <!-- Flecha o Conector -->
        <div class="flex items-center justify-center py-1 sm:py-0 px-2 shrink-0">
          <svg 
            class={[
              'w-5 h-5 transition-all duration-500 rotate-90 sm:rotate-0',
              valorSeleccionado ? 'text-brand-green' : 'text-slate-200 group-hover:text-slate-300'
            ].join(' ')} 
            fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/>
          </svg>
        </div>

        <!-- Selector de definición -->
        <div class="flex-1 relative">
          <select
            value={valorSeleccionado}
            onchange={(e) => seleccionarDefinicion(concepto.clave, e.currentTarget.value)}
            {disabled}
            aria-label="Definición para {concepto.texto}"
            class={[
              'w-full appearance-none rounded-b-2xl sm:rounded-2xl border-2 px-4 py-3 text-base font-bold tracking-tight h-full',
              'focus:outline-none focus:border-brand-red focus:ring-4 focus:ring-brand-red/5 transition-all duration-300',
              valorSeleccionado
                ? 'border-brand-green/20 bg-brand-green/[0.03] text-brand-green'
                : 'border-slate-100 bg-brand-gray text-slate-400 group-hover:border-slate-300',
              disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
            ].join(' ')}
          >
            <option value="">— Seleccionar definición —</option>
            {#each definiciones as def}
              <option value={def}>{def}</option>
            {/each}
          </select>
          <div class={[
            'absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors',
            valorSeleccionado ? 'text-brand-green' : 'text-slate-300'
          ].join(' ')}>
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="4"><path d="M19 9l-7 7-7-7"/></svg>
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>
