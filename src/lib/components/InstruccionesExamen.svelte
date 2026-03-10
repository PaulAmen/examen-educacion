<script lang="ts">
  let { estado }: { estado: 'pendiente' | 'en_curso' | 'finalizado' } = $props();

  let abierto = $state(estado === 'pendiente');

  const pasos = $derived([
    {
      num: 1,
      label: 'Iniciar sesión',
      desc: 'Con tu cuenta Google institucional @unesum.edu.ec',
      done: true,
      activo: false
    },
    {
      num: 2,
      label: 'Verificar habilitación',
      desc: 'El docente activa el examen en el horario programado',
      done: true,
      activo: false
    },
    {
      num: 3,
      label: 'Iniciar examen',
      desc: 'El contador de 2 horas comienza al pulsar el botón',
      done: estado !== 'pendiente',
      activo: estado === 'pendiente'
    },
    {
      num: 4,
      label: 'Responder preguntas',
      desc: 'Página a página. Tu progreso se guarda automáticamente',
      done: false,
      activo: estado === 'en_curso'
    },
    {
      num: 5,
      label: 'Entregar evaluación',
      desc: 'En la última página o al agotarse el tiempo',
      done: false,
      activo: false
    }
  ]);

  const tipos = [
    {
      nombre: 'Opción Múltiple',
      color: 'text-brand-red',
      bg: 'bg-brand-red/5 border-brand-red/10',
      instruccion: 'Selecciona UNA de las cuatro opciones. Las respuestas aparecen en orden aleatorio.',
      alerta: null,
      icono: `<circle cx="12" cy="12" r="9" stroke-width="2.5"/><circle cx="12" cy="12" r="4" fill="currentColor"/>`
    },
    {
      nombre: 'Verdadero o Falso',
      color: 'text-brand-green',
      bg: 'bg-brand-green/5 border-brand-green/10',
      instruccion: 'Indica si el enunciado presentado es Verdadero o Falso. Cada pregunta vale el 50% del puntaje asignado.',
      alerta: null,
      icono: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>`
    },
    {
      nombre: 'Casos de Uso',
      color: 'text-brand-orange',
      bg: 'bg-brand-orange/5 border-brand-orange/10',
      instruccion: 'Lee el caso presentado y selecciona la mejor respuesta entre las cuatro opciones disponibles.',
      alerta: null,
      icono: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"/>`
    },
    {
      nombre: 'Unir con Líneas',
      color: 'text-purple-600',
      bg: 'bg-purple-50 border-purple-100',
      instruccion: 'Empareja cada concepto de la izquierda con su definición usando el menú desplegable.',
      alerta: null,
      icono: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/>`
    }
  ];
</script>

<div class="max-w-md w-full space-y-3">
  <!-- Toggle header -->
  <button
    onclick={() => (abierto = !abierto)}
    class="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-slate-200 transition-all group"
  >
    <div class="flex items-center gap-2.5">
      <div class="w-7 h-7 rounded-lg bg-brand-gray flex items-center justify-center text-brand-red shrink-0">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"/>
        </svg>
      </div>
      <span class="text-xs font-black text-slate-700 uppercase tracking-widest">Guía del Examen</span>
    </div>
    <svg
      class="w-4 h-4 text-slate-400 transition-transform duration-300 {abierto ? 'rotate-180' : ''}"
      fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"
    >
      <path d="M19 9l-7 7-7-7"/>
    </svg>
  </button>

  {#if abierto}
    <div class="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">

      <!-- Flujo del proceso -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div class="px-4 py-3 border-b border-slate-50 bg-slate-50/50">
          <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Flujo del proceso</p>
        </div>
        <div class="px-4 py-3 space-y-0">
          {#each pasos as paso, i}
            <div class="flex gap-3 {i < pasos.length - 1 ? 'pb-3' : ''}">
              <!-- Línea vertical + número -->
              <div class="flex flex-col items-center shrink-0">
                <div class={[
                  'w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 border-2 transition-all',
                  paso.done
                    ? 'bg-brand-green border-brand-green text-white'
                    : paso.activo
                      ? 'bg-brand-red border-brand-red text-white shadow-md shadow-brand-red/20'
                      : 'bg-white border-slate-200 text-slate-400'
                ].join(' ')}>
                  {#if paso.done}
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3.5">
                      <path d="M5 13l4 4L19 7"/>
                    </svg>
                  {:else}
                    {paso.num}
                  {/if}
                </div>
                {#if i < pasos.length - 1}
                  <div class={[
                    'w-0.5 flex-1 mt-1 min-h-[16px]',
                    paso.done ? 'bg-brand-green/30' : 'bg-slate-100'
                  ].join(' ')}></div>
                {/if}
              </div>
              <!-- Texto -->
              <div class="pb-0 min-w-0">
                <p class={[
                  'text-xs font-black leading-tight',
                  paso.activo ? 'text-brand-red' : paso.done ? 'text-slate-500' : 'text-slate-400'
                ].join(' ')}>
                  {paso.label}
                  {#if paso.activo}
                    <span class="ml-1.5 text-[9px] bg-brand-red text-white px-1.5 py-0.5 rounded-full uppercase tracking-wider font-black">Ahora</span>
                  {/if}
                </p>
                <p class="text-[10px] text-slate-400 mt-0.5 leading-relaxed font-medium">{paso.desc}</p>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <!-- Tipos de pregunta -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div class="px-4 py-3 border-b border-slate-50 bg-slate-50/50">
          <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipos de pregunta</p>
        </div>
        <div class="divide-y divide-slate-50">
          {#each tipos as tipo}
            <div class="px-4 py-3 space-y-1.5">
              <div class="flex items-center gap-2">
                <div class={['w-6 h-6 rounded-lg flex items-center justify-center shrink-0', tipo.bg].join(' ')}>
                  <svg class="w-3.5 h-3.5 {tipo.color}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {@html tipo.icono}
                  </svg>
                </div>
                <span class="text-[10px] font-black uppercase tracking-widest {tipo.color}">{tipo.nombre}</span>
              </div>
              <p class="text-[11px] text-slate-600 font-medium leading-relaxed pl-8">{tipo.instruccion}</p>
              {#if tipo.alerta}
                <div class="ml-8 flex items-start gap-1.5 bg-brand-orange/5 border border-brand-orange/15 rounded-lg px-2.5 py-2">
                  <svg class="w-3 h-3 text-brand-orange shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                  <p class="text-[10px] text-brand-orange font-bold leading-snug">{tipo.alerta}</p>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>

    </div>
  {/if}
</div>
