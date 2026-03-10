<script lang="ts">
  import { base } from '$app/paths';

  // ── Opción Múltiple ─────────────────────────────────────────────────────────
  const opcionesOM = [
    { letra: 'A', texto: 'Agua (H₂O)' },
    { letra: 'B', texto: 'Dióxido de carbono (CO₂)' },
    { letra: 'C', texto: 'Oxígeno (O₂)' },
    { letra: 'D', texto: 'Nitrógeno (N₂)' }
  ];
  const correctaOM = 'B';
  let respOM = $state('');

  // ── Verdadero o Falso (respuesta: Verdadero) ────────────────────────────────
  const correctaVF = 'Verdadero';
  let respVF = $state('');

  // ── Verdadero o Falso (respuesta: Falso + justificación) ────────────────────
  const correctaVF2 = 'Falso';
  let respVF2 = $state('');
  let justVF2 = $state('');
  const palabrasClave = ['oxígeno', 'o2', 'produce', 'libera', 'fotosíntesis', 'clorofila', 'luz solar', 'co2', 'consume'];
  const palabrasEncontradas = $derived(
    palabrasClave.filter(p => justVF2.toLowerCase().includes(p))
  );
  const justificacionValida = $derived(palabrasEncontradas.length >= 2);

  // ── Casos de Uso ────────────────────────────────────────────────────────────
  const opcionesCU = [
    { letra: 'A', texto: 'Contratar más docentes presenciales' },
    { letra: 'B', texto: 'Implementar una plataforma de aprendizaje en línea (LMS)' },
    { letra: 'C', texto: 'Reducir el número de materias ofertadas' },
    { letra: 'D', texto: 'Eliminar las evaluaciones del pensum' }
  ];
  const correctaCU = 'B';
  let respCU = $state('');

  // ── Unir con Líneas ─────────────────────────────────────────────────────────
  const conceptos = [
    { clave: 'C1', texto: 'Mamífero' },
    { clave: 'C2', texto: 'Reptil' },
    { clave: 'C3', texto: 'Ave' },
    { clave: 'C4', texto: 'Pez' }
  ];
  const definiciones = [
    'Animal acuático con branquias y aletas',
    'Vertebrado con plumas, pico y alas',
    'Animal de sangre fría cubierto de escamas',
    'Vertebrado de sangre caliente que amamanta a sus crías'
  ];
  const correctasUL: Record<string, string> = {
    C1: 'Vertebrado de sangre caliente que amamanta a sus crías',
    C2: 'Animal de sangre fría cubierto de escamas',
    C3: 'Vertebrado con plumas, pico y alas',
    C4: 'Animal acuático con branquias y aletas'
  };
  let respUL = $state<Record<string, string>>({});

  const aciertosUL = $derived(
    conceptos.filter(c => respUL[c.clave] === correctasUL[c.clave]).length
  );
  const completosUL = $derived(conceptos.filter(c => !!respUL[c.clave]).length);

  function selUL(clave: string, def: string) {
    respUL = { ...respUL, [clave]: def };
  }

  function reiniciar() {
    respOM = '';
    respVF = '';
    respVF2 = '';
    justVF2 = '';
    respCU = '';
    respUL = {};
  }

  const pasos = [
    { num: 1, label: 'Iniciar sesión', desc: 'Ingresa con tu cuenta Google institucional (@unesum.edu.ec).' },
    { num: 2, label: 'Verificar habilitación', desc: 'El docente activa el examen en el horario programado. Espera en esta pantalla.' },
    { num: 3, label: 'Iniciar examen', desc: 'Pulsa el botón para comenzar. El contador de 2 horas inicia en ese momento.' },
    { num: 4, label: 'Responder preguntas', desc: 'Avanza página por página. Tus respuestas se guardan automáticamente.' },
    { num: 5, label: 'Entregar evaluación', desc: 'En la última página encontrarás el botón de entrega. Si el tiempo se agota, se entrega automáticamente.' }
  ];
</script>

<svelte:head>
  <title>Guía del Examen — UNESUM</title>
</svelte:head>

<div class="min-h-screen bg-brand-gray font-sans">

  <!-- Header -->
  <header class="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-sm">
    <div class="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <img src="{base}/logo.webp" alt="Logo UNESUM" class="h-8 object-contain" />
        <div>
          <p class="text-xs font-black text-slate-900 uppercase tracking-tight leading-none">Guía del Examen</p>
          <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">UNESUM</p>
        </div>
      </div>
      <button
        onclick={() => window.close()}
        class="flex items-center gap-1.5 text-[11px] font-black text-slate-400 hover:text-brand-red uppercase tracking-widest transition-colors px-3 py-1.5 rounded-lg hover:bg-brand-red/5"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
          <path d="M6 18L18 6M6 6l12 12"/>
        </svg>
        Cerrar
      </button>
    </div>
  </header>

  <main class="max-w-2xl mx-auto px-4 py-10 space-y-12 pb-20">

    <!-- ── Flujo del proceso ────────────────────────────────────────────── -->
    <section class="space-y-6">
      <div class="space-y-1">
        <p class="text-[10px] font-black text-brand-red uppercase tracking-widest">Paso a paso</p>
        <h2 class="text-2xl font-black text-slate-900 tracking-tight">¿Cómo funciona el examen?</h2>
        <p class="text-sm text-slate-500 font-medium">Sigue estos pasos el día de tu evaluación.</p>
      </div>

      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-0">
        {#each pasos as paso, i}
          <div class="flex gap-4 {i < pasos.length - 1 ? 'pb-6' : ''}">
            <div class="flex flex-col items-center shrink-0">
              <div class="w-9 h-9 rounded-full bg-brand-red text-white flex items-center justify-center text-sm font-black shadow-sm shadow-brand-red/20">
                {paso.num}
              </div>
              {#if i < pasos.length - 1}
                <div class="w-0.5 bg-slate-100 flex-1 mt-2 min-h-[24px]"></div>
              {/if}
            </div>
            <div class="pt-1.5">
              <p class="text-sm font-black text-slate-900">{paso.label}</p>
              <p class="text-sm text-slate-500 font-medium mt-0.5 leading-relaxed">{paso.desc}</p>
            </div>
          </div>
        {/each}
      </div>
    </section>

    <!-- ── Tipos de pregunta ────────────────────────────────────────────── -->
    <section class="space-y-6">
      <div class="space-y-1">
        <p class="text-[10px] font-black text-brand-red uppercase tracking-widest">Práctica interactiva</p>
        <h2 class="text-2xl font-black text-slate-900 tracking-tight">Tipos de pregunta</h2>
        <p class="text-sm text-slate-500 font-medium">Practica con estos ejemplos antes de iniciar tu evaluación.</p>
      </div>

      <div class="flex justify-end">
        <button
          onclick={reiniciar}
          class="text-[11px] font-black text-slate-400 hover:text-brand-red uppercase tracking-widest transition-colors px-3 py-1.5 rounded-lg hover:bg-brand-red/5"
        >
          Reiniciar ejemplos
        </button>
      </div>

      <!-- 1. Opción Múltiple -->
      <div class="space-y-3">
        <div class="flex items-center gap-3">
          <span class="text-[10px] font-black text-brand-red bg-brand-red/5 px-3 py-1.5 rounded-lg uppercase tracking-widest border border-brand-red/10">
            Opción Múltiple
          </span>
        </div>
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div class="p-6 space-y-2">
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cómo responder</p>
            <p class="text-sm text-slate-600 font-medium leading-relaxed">
              Selecciona <strong class="text-slate-800">una sola opción</strong> de las cuatro disponibles. Las opciones aparecen en orden aleatorio en el examen real.
            </p>
          </div>
          <div class="px-6 pb-5 space-y-4">
            <div class="border-t border-slate-50 pt-5">
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Ejemplo</p>
              <p class="text-base font-bold text-slate-900 leading-snug mb-4">
                ¿Cuál es el principal gas que producen los seres vivos al respirar?
              </p>
              <div class="grid sm:grid-cols-2 gap-2">
                {#each opcionesOM as op}
                  {@const seleccionada = respOM === op.letra}
                  {@const correcta = op.letra === correctaOM}
                  {@const mostrarFeedback = respOM !== ''}
                  <button
                    onclick={() => { if (!respOM) respOM = op.letra; }}
                    class={[
                      'flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all duration-300',
                      mostrarFeedback
                        ? correcta
                          ? 'border-brand-green bg-brand-green/5'
                          : seleccionada
                            ? 'border-brand-red bg-brand-red/5'
                            : 'border-slate-100 opacity-40'
                        : seleccionada
                          ? 'border-brand-green bg-brand-green/5'
                          : 'border-slate-100 hover:border-slate-300 cursor-pointer'
                    ].join(' ')}
                  >
                    <span class={[
                      'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0',
                      mostrarFeedback
                        ? correcta ? 'bg-brand-green text-white'
                          : seleccionada ? 'bg-brand-red text-white'
                          : 'bg-slate-100 text-slate-300'
                        : seleccionada ? 'bg-brand-green text-white' : 'bg-slate-100 text-slate-500'
                    ].join(' ')}>
                      {#if mostrarFeedback && correcta}
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="4"><path d="M5 13l4 4L19 7"/></svg>
                      {:else if mostrarFeedback && seleccionada && !correcta}
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="4"><path d="M6 18L18 6M6 6l12 12"/></svg>
                      {:else}
                        {op.letra}
                      {/if}
                    </span>
                    <span class={[
                      'text-sm font-bold',
                      mostrarFeedback ? correcta ? 'text-brand-green' : seleccionada ? 'text-brand-red' : 'text-slate-300'
                      : seleccionada ? 'text-brand-green' : 'text-slate-700'
                    ].join(' ')}>{op.texto}</span>
                  </button>
                {/each}
              </div>
            </div>
          </div>
          {#if respOM}
            <div class={['px-6 py-3 flex items-center gap-2 text-sm font-bold', respOM === correctaOM ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-red/10 text-brand-red'].join(' ')}>
              <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                {#if respOM === correctaOM}<path d="M5 13l4 4L19 7"/>{:else}<path d="M6 18L18 6M6 6l12 12"/>{/if}
              </svg>
              {respOM === correctaOM ? '¡Correcto! Los seres vivos expulsan CO₂ al respirar.' : 'Incorrecto. La respuesta correcta es CO₂ — opción B.'}
            </div>
          {:else}
            <div class="px-6 py-3 bg-slate-50 border-t border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-widest">Toca una opción para responder</div>
          {/if}
        </div>
      </div>

      <!-- 2. Verdadero o Falso -->
      <div class="space-y-3">
        <div class="flex items-center gap-3">
          <span class="text-[10px] font-black text-brand-green bg-brand-green/5 px-3 py-1.5 rounded-lg uppercase tracking-widest border border-brand-green/10">
            Verdadero o Falso
          </span>
        </div>
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div class="p-6 space-y-2">
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cómo responder</p>
            <p class="text-sm text-slate-600 font-medium leading-relaxed">
              Lee el enunciado e indica si es <strong class="text-slate-800">Verdadero o Falso</strong>. No se requiere justificación.
            </p>
          </div>
          <div class="px-6 pb-5 space-y-4">
            <div class="border-t border-slate-50 pt-5">
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Ejemplo</p>
              <p class="text-base font-bold text-slate-900 leading-snug mb-4">
                La Luna tarda aproximadamente 28 días en dar una vuelta completa alrededor de la Tierra.
              </p>
              <div class="grid grid-cols-2 gap-3">
                {#each ['Verdadero', 'Falso'] as opcion}
                  {@const seleccionada = respVF === opcion}
                  {@const correcta = opcion === correctaVF}
                  {@const mostrarFeedback = respVF !== ''}
                  <button
                    onclick={() => { if (!respVF) respVF = opcion; }}
                    class={[
                      'py-5 rounded-2xl font-black text-sm tracking-wide uppercase transition-all duration-300 border-2',
                      mostrarFeedback
                        ? correcta ? 'bg-brand-green border-brand-green text-white'
                          : seleccionada ? 'bg-brand-red border-brand-red text-white'
                          : 'border-slate-100 text-slate-300 opacity-40'
                        : seleccionada
                          ? opcion === 'Verdadero' ? 'bg-brand-green border-brand-green text-white' : 'bg-brand-red border-brand-red text-white'
                          : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 cursor-pointer'
                    ].join(' ')}
                  >
                    <div class="flex items-center justify-center gap-2">
                      {#if mostrarFeedback && (correcta || seleccionada)}
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="4">
                          {#if correcta}<path d="M5 13l4 4L19 7"/>{:else}<path d="M6 18L18 6M6 6l12 12"/>{/if}
                        </svg>
                      {/if}
                      {opcion}
                    </div>
                  </button>
                {/each}
              </div>
            </div>
          </div>
          {#if respVF}
            <div class={['px-6 py-3 flex items-center gap-2 text-sm font-bold', respVF === correctaVF ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-red/10 text-brand-red'].join(' ')}>
              <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                {#if respVF === correctaVF}<path d="M5 13l4 4L19 7"/>{:else}<path d="M6 18L18 6M6 6l12 12"/>{/if}
              </svg>
              {respVF === correctaVF ? '¡Correcto! La Luna tarda ~28 días en orbitar la Tierra.' : 'Incorrecto. El enunciado es verdadero.'}
            </div>
          {:else}
            <div class="px-6 py-3 bg-slate-50 border-t border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-widest">Selecciona Verdadero o Falso</div>
          {/if}
        </div>
      </div>

      <!-- 2b. Verdadero o Falso — respuesta Falso con justificación -->
      <div class="space-y-3">
        <div class="flex items-center gap-3">
          <span class="text-[10px] font-black text-brand-green bg-brand-green/5 px-3 py-1.5 rounded-lg uppercase tracking-widest border border-brand-green/10">
            Verdadero o Falso
          </span>
          <span class="text-[10px] font-black text-brand-orange bg-brand-orange/5 px-2.5 py-1 rounded-lg uppercase tracking-widest border border-brand-orange/10">
            Con justificación
          </span>
        </div>
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div class="px-6 pb-6 space-y-4">
            <div class="border-t border-slate-50 pt-5">
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Ejemplo</p>
              <p class="text-base font-bold text-slate-900 leading-snug mb-4">
                La fotosíntesis produce dióxido de carbono (CO₂) como producto principal.
              </p>

              <!-- Botones V/F -->
              <div class="grid grid-cols-2 gap-3 mb-4">
                {#each ['Verdadero', 'Falso'] as opcion}
                  {@const seleccionada = respVF2 === opcion}
                  {@const correcta = opcion === correctaVF2}
                  <button
                    onclick={() => { respVF2 = opcion; if (opcion === 'Verdadero') justVF2 = ''; }}
                    class={[
                      'py-5 rounded-2xl font-black text-sm tracking-wide uppercase transition-all duration-300 border-2',
                      seleccionada
                        ? opcion === 'Verdadero' ? 'bg-brand-green border-brand-green text-white'
                          : 'bg-brand-red border-brand-red text-white'
                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 cursor-pointer'
                    ].join(' ')}
                  >
                    <div class="flex items-center justify-center gap-2">
                      {#if seleccionada}
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="4">
                          <path d="M5 13l4 4L19 7"/>
                        </svg>
                      {/if}
                      {opcion}
                    </div>
                  </button>
                {/each}
              </div>

              <!-- Justificación — solo cuando responde Falso -->
              {#if respVF2 === 'Falso'}
                <div class={[
                  'rounded-2xl p-5 border-2 transition-all duration-300',
                  justificacionValida ? 'bg-brand-green/[0.03] border-brand-green/20' : 'bg-brand-gray border-slate-100'
                ].join(' ')}>
                  <label for="just-vf2" class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
                    ¿Por qué es falso?
                  </label>
                  <textarea
                    id="just-vf2"
                    value={justVF2}
                    oninput={(e) => (justVF2 = e.currentTarget.value)}
                    rows="3"
                    placeholder="Ej: La fotosíntesis produce oxígeno (O₂) y consume CO₂ con ayuda de la luz solar y la clorofila…"
                    class={[
                      'w-full rounded-xl border-2 px-4 py-3 text-sm leading-relaxed font-medium text-slate-700',
                      'focus:outline-none focus:border-brand-red focus:ring-4 focus:ring-brand-red/5 resize-none transition-all bg-white',
                      justificacionValida ? 'border-brand-green/30' : 'border-slate-200'
                    ].join(' ')}
                  ></textarea>
                </div>
              {/if}

              <!-- Feedback cuando respondió Verdadero (incorrectamente) -->
              {#if respVF2 === 'Verdadero'}
                <div class="bg-brand-red/10 text-brand-red px-4 py-3 rounded-xl flex items-start gap-2 text-sm font-bold">
                  <svg class="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path d="M6 18L18 6M6 6l12 12"/></svg>
                  Incorrecto. La fotosíntesis consume CO₂ y produce oxígeno (O₂), no al revés.
                </div>
              {/if}
            </div>
          </div>

          <!-- Barra de estado inferior -->
          {#if respVF2 === 'Falso' && justVF2.trim().length > 0}
            <div class={[
              'px-6 py-3 flex items-center gap-2 text-sm font-bold border-t',
              justificacionValida
                ? 'bg-brand-green/10 text-brand-green border-brand-green/10'
                : 'bg-brand-orange/10 text-brand-orange border-brand-orange/10'
            ].join(' ')}>
              <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                {#if justificacionValida}
                  <path d="M5 13l4 4L19 7"/>
                {:else}
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                {/if}
              </svg>
              {justificacionValida
                ? '¡Bien! Tu justificación es válida para este ejemplo.'
                : 'Agrega más detalle a tu justificación.'}
            </div>
          {:else if respVF2 === 'Falso' && justVF2.trim().length === 0}
            <div class="px-6 py-3 bg-slate-50 border-t border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-widest">
              Escribe tu justificación arriba
            </div>
          {:else if !respVF2}
            <div class="px-6 py-3 bg-slate-50 border-t border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-widest">
              Selecciona Verdadero o Falso
            </div>
          {/if}
        </div>
      </div>

      <!-- 3. Casos de Uso -->
      <div class="space-y-3">
        <div class="flex items-center gap-3">
          <span class="text-[10px] font-black text-brand-orange bg-brand-orange/5 px-3 py-1.5 rounded-lg uppercase tracking-widest border border-brand-orange/10">
            Casos de Uso
          </span>
        </div>
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div class="p-6 space-y-2">
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cómo responder</p>
            <p class="text-sm text-slate-600 font-medium leading-relaxed">
              Lee el caso presentado y selecciona la <strong class="text-slate-800">mejor opción</strong> que resuelve la situación planteada.
            </p>
          </div>
          <div class="px-6 pb-5 space-y-4">
            <div class="border-t border-slate-50 pt-5">
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Ejemplo</p>
              <p class="text-base font-bold text-slate-900 leading-snug mb-4">
                Una universidad quiere ofrecer sus cursos a estudiantes de todo el país sin incrementar la infraestructura física. ¿Qué solución tecnológica es la más adecuada?
              </p>
              <div class="grid sm:grid-cols-2 gap-2">
                {#each opcionesCU as op}
                  {@const seleccionada = respCU === op.letra}
                  {@const correcta = op.letra === correctaCU}
                  {@const mostrarFeedback = respCU !== ''}
                  <button
                    onclick={() => { if (!respCU) respCU = op.letra; }}
                    class={[
                      'flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all duration-300',
                      mostrarFeedback
                        ? correcta ? 'border-brand-green bg-brand-green/5'
                          : seleccionada ? 'border-brand-red bg-brand-red/5'
                          : 'border-slate-100 opacity-40'
                        : seleccionada ? 'border-brand-green bg-brand-green/5'
                          : 'border-slate-100 hover:border-slate-300 cursor-pointer'
                    ].join(' ')}
                  >
                    <span class={[
                      'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0',
                      mostrarFeedback
                        ? correcta ? 'bg-brand-green text-white'
                          : seleccionada ? 'bg-brand-red text-white'
                          : 'bg-slate-100 text-slate-300'
                        : seleccionada ? 'bg-brand-green text-white' : 'bg-slate-100 text-slate-500'
                    ].join(' ')}>
                      {#if mostrarFeedback && correcta}
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="4"><path d="M5 13l4 4L19 7"/></svg>
                      {:else if mostrarFeedback && seleccionada && !correcta}
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="4"><path d="M6 18L18 6M6 6l12 12"/></svg>
                      {:else}
                        {op.letra}
                      {/if}
                    </span>
                    <span class={[
                      'text-sm font-bold',
                      mostrarFeedback ? correcta ? 'text-brand-green' : seleccionada ? 'text-brand-red' : 'text-slate-300'
                      : seleccionada ? 'text-brand-green' : 'text-slate-700'
                    ].join(' ')}>{op.texto}</span>
                  </button>
                {/each}
              </div>
            </div>
          </div>
          {#if respCU}
            <div class={['px-6 py-3 flex items-center gap-2 text-sm font-bold', respCU === correctaCU ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-red/10 text-brand-red'].join(' ')}>
              <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                {#if respCU === correctaCU}<path d="M5 13l4 4L19 7"/>{:else}<path d="M6 18L18 6M6 6l12 12"/>{/if}
              </svg>
              {respCU === correctaCU ? '¡Correcto! El LMS permite educar a distancia sin infraestructura adicional.' : 'Incorrecto. La opción B (plataforma LMS) es la más adecuada.'}
            </div>
          {:else}
            <div class="px-6 py-3 bg-slate-50 border-t border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-widest">Toca una opción para responder</div>
          {/if}
        </div>
      </div>

      <!-- 4. Unir con Líneas -->
      <div class="space-y-3">
        <div class="flex items-center gap-3">
          <span class="text-[10px] font-black text-purple-600 bg-purple-50 px-3 py-1.5 rounded-lg uppercase tracking-widest border border-purple-100">
            Unir con Líneas
          </span>
        </div>
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div class="p-6 space-y-2">
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cómo responder</p>
            <p class="text-sm text-slate-600 font-medium leading-relaxed">
              Para cada concepto de la izquierda, selecciona su definición correcta en el <strong class="text-slate-800">menú desplegable</strong> de la derecha. Las definiciones aparecen en orden aleatorio.
            </p>
          </div>
          <div class="px-6 pb-5 space-y-4">
            <div class="border-t border-slate-50 pt-5">
              <div class="flex items-center justify-between mb-3">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ejemplo</p>
                <span class={[
                  'text-[10px] font-black px-2 py-0.5 rounded-md border uppercase tracking-tighter',
                  completosUL === conceptos.length ? 'bg-brand-green/10 text-brand-green border-brand-green/20' : 'bg-slate-100 text-slate-400 border-slate-200'
                ].join(' ')}>
                  {completosUL} / {conceptos.length} listos
                </span>
              </div>
              <p class="text-base font-bold text-slate-900 leading-snug mb-4">
                Empareja cada animal con su descripción.
              </p>
              <div class="grid gap-3">
                {#each conceptos as c}
                  {@const val = respUL[c.clave] ?? ''}
                  {@const correcto = val !== '' && val === correctasUL[c.clave]}
                  {@const incorrecto = val !== '' && val !== correctasUL[c.clave]}
                  <div class="flex flex-col sm:flex-row sm:items-stretch gap-0 sm:gap-3">
                    <div class={[
                      'flex-1 text-sm font-bold px-4 py-3 rounded-t-xl sm:rounded-xl border-2 flex items-center transition-all',
                      correcto ? 'bg-brand-green/5 border-brand-green/20 text-brand-green'
                        : incorrecto ? 'bg-brand-red/5 border-brand-red/20 text-brand-red'
                        : 'bg-white text-slate-700 border-slate-100'
                    ].join(' ')}>
                      {c.texto}
                    </div>
                    <div class="flex items-center justify-center py-1 sm:py-0 px-2 shrink-0">
                      <svg class={[
                        'w-5 h-5 rotate-90 sm:rotate-0 transition-colors',
                        correcto ? 'text-brand-green' : incorrecto ? 'text-brand-red' : 'text-slate-200'
                      ].join(' ')} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/>
                      </svg>
                    </div>
                    <div class="flex-1 relative">
                      <select
                        value={val}
                        onchange={(e) => selUL(c.clave, e.currentTarget.value)}
                        class={[
                          'w-full appearance-none rounded-b-xl sm:rounded-xl border-2 px-4 py-3 text-sm font-bold h-full cursor-pointer',
                          'focus:outline-none focus:border-brand-red focus:ring-4 focus:ring-brand-red/5 transition-all',
                          correcto ? 'border-brand-green/20 bg-brand-green/5 text-brand-green'
                            : incorrecto ? 'border-brand-red/20 bg-brand-red/5 text-brand-red'
                            : 'border-slate-100 bg-slate-50 text-slate-400'
                        ].join(' ')}
                      >
                        <option value="">— Seleccionar definición —</option>
                        {#each definiciones as def}
                          <option value={def}>{def}</option>
                        {/each}
                      </select>
                      <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg class="w-4 h-4 {correcto ? 'text-brand-green' : incorrecto ? 'text-brand-red' : 'text-slate-300'}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="4"><path d="M19 9l-7 7-7-7"/></svg>
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          </div>
          {#if completosUL === conceptos.length}
            <div class={['px-6 py-3 flex items-center gap-2 text-sm font-bold', aciertosUL === conceptos.length ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-orange/10 text-brand-orange'].join(' ')}>
              <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                {#if aciertosUL === conceptos.length}<path d="M5 13l4 4L19 7"/>{:else}<path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>{/if}
              </svg>
              {aciertosUL === conceptos.length ? '¡Perfecto! Todos los pares son correctos.' : `${aciertosUL} de ${conceptos.length} correctos. Los marcados en rojo no coinciden.`}
            </div>
          {:else}
            <div class="px-6 py-3 bg-slate-50 border-t border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-widest">Usa los menús para emparejar cada animal</div>
          {/if}
        </div>
      </div>

    </section>

  </main>

  <footer class="border-t border-slate-200/50 py-6 text-center text-[11px] font-black text-slate-400 uppercase tracking-widest">
    UNESUM — Sistema de Evaluación Académica
  </footer>
</div>

<style>
  :global(body) { background-color: #f8f9fa; }
</style>
