<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { base } from '$app/paths';
  import { authStore, DOMINIO_INSTITUCIONAL } from '$lib/auth.svelte.js';
  import { examenStore } from '$lib/state/examen.svelte.js';
  import PreguntaRenderer from '$lib/components/PreguntaRenderer.svelte';
  import Temporizador from '$lib/components/Temporizador.svelte';
  import IndicadorGuardado from '$lib/components/IndicadorGuardado.svelte';

  const PREGUNTAS_POR_PAGINA = 10;

  let inicializado = $state(false);
  let examenAbierto = $state(false); // false = pantalla de bienvenida, true = examen activo
  let confirmando = $state(false);
  let paginaActual = $state(0);
  let online = $state(true);

  $effect(() => {
    if (authStore.user && !authStore.loading && !inicializado) {
      inicializado = true;
      examenStore.inicializar(authStore.user.email!);
    }
  });

  onMount(() => {
    const updateOnlineStatus = () => (online = navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  });

  onDestroy(() => examenStore.destroy());

  // Si el admin deshabilita mientras el examen está abierto, volver a pantalla de espera
  $effect(() => {
    if (examenStore.examenDeshabilitado && examenAbierto) {
      examenAbierto = false;
    }
  });

  const bloqueado = $derived(examenStore.estado === 'finalizado');
  const enCurso = $derived(examenStore.estado === 'en_curso');
  const autorizado = $derived(
    !examenStore.sinExamen && !examenStore.examenDeshabilitado && !examenStore.error
  );
  const sinResponder = $derived(examenStore.preguntas.length - examenStore.preguntasRespondidas);
  const totalPaginas = $derived(Math.ceil(examenStore.preguntas.length / PREGUNTAS_POR_PAGINA));
  const preguntasPagina = $derived(
    examenStore.preguntas.slice(
      paginaActual * PREGUNTAS_POR_PAGINA,
      (paginaActual + 1) * PREGUNTAS_POR_PAGINA
    )
  );
  const esUltimaPagina = $derived(paginaActual >= totalPaginas - 1);

  function irAPagina(n: number) {
    paginaActual = n;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function abrirExamen() {
    await examenStore.iniciarExamen(); // solo actúa si estado === 'pendiente'
    examenAbierto = true;
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  async function confirmarEntrega() {
    confirmando = false;
    await examenStore.entregarExamen();
  }

  function etiquetaNivel(n: 4 | 8 | null) {
    return n === 4 ? '4to Nivel' : n === 8 ? '8vo Nivel' : '';
  }
</script>

<svelte:head>
  <title>Evaluación Académica — UNESUM</title>
</svelte:head>

<div class="min-h-screen bg-brand-gray font-sans selection:bg-brand-red/10 selection:text-brand-red">

  <!-- ── Status Bar (Offline) ──────────────────────────────────────────────── -->
  {#if !online}
    <div class="bg-brand-orange text-white text-[10px] font-bold py-1 px-4 text-center sticky top-0 z-[60] flex items-center justify-center gap-2 animate-pulse">
      <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
        <path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.58 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" />
      </svg>
      SIN CONEXIÓN — TUS RESPUESTAS SE GUARDAN LOCALMENTE
    </div>
  {/if}

  {#if !examenAbierto}
    <!-- Shared container for all screens EXCEPT the active exam -->
    <div class="flex flex-col items-center justify-center min-h-screen px-4 py-12">
      
      {#if authStore.loading}
        <div class="flex flex-col items-center justify-center">
          <div class="relative w-12 h-12">
            <div class="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
            <div class="absolute inset-0 border-4 border-brand-red border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p class="mt-4 text-slate-500 font-medium text-sm">Verificando sesión…</p>
        </div>

      {:else if authStore.errorDominio}
        <div class="card p-8 max-w-sm w-full text-center space-y-4">
          <div class="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto text-brand-red">
            <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
            </svg>
          </div>
          <h2 class="text-xl font-bold text-slate-900">Acceso denegado</h2>
          <p class="text-slate-500 text-sm leading-relaxed">
            Solo se permiten cuentas institucionales <strong>{DOMINIO_INSTITUCIONAL}</strong>
          </p>
          <button onclick={() => authStore.loginConGoogle()} class="btn btn-outline w-full py-3">
            Intentar con otra cuenta
          </button>
        </div>

      {:else if !authStore.user}
        <div class="card p-8 w-full max-w-sm text-center space-y-8 bg-white/80 backdrop-blur-sm">
          <div class="space-y-4">
            <img src="{base}/logo.webp" alt="Logo UNESUM" class="h-20 object-contain mx-auto transition-transform hover:scale-105 duration-500" />
            <div class="space-y-1">
              <h1 class="text-2xl font-black text-slate-900 tracking-tight">EVALUACIÓN ACADÉMICA</h1>
              <p class="text-slate-500 text-sm font-medium uppercase tracking-widest">UNESUM</p>
            </div>
          </div>
          <div class="p-4 bg-brand-gray/50 rounded-xl border border-slate-100">
            <p class="text-slate-500 text-xs leading-relaxed">
              Ingresa con tu cuenta institucional<br>
              <strong class="text-slate-700 font-bold">{DOMINIO_INSTITUCIONAL}</strong>
            </p>
          </div>
          <button onclick={() => authStore.loginConGoogle()} class="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-200 hover:border-brand-red text-slate-700 font-bold py-4 px-4 rounded-xl transition-all hover:shadow-xl hover:-translate-y-0.5">
            <svg class="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Ingresar con Google
          </button>
        </div>

      {:else if examenStore.cargando}
        <div class="flex flex-col items-center">
          <div class="relative w-12 h-12">
            <div class="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
            <div class="absolute inset-0 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p class="mt-4 text-slate-500 font-medium text-sm">Cargando tu examen…</p>
        </div>

      {:else if examenStore.error}
        <div class="card p-8 max-w-md text-center space-y-6">
          <div class="w-16 h-16 bg-red-50 text-brand-red rounded-full flex items-center justify-center mx-auto">
            <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <h2 class="text-xl font-bold text-slate-900">Error de carga</h2>
            <p class="text-slate-500 text-sm mt-2">{examenStore.error}</p>
          </div>
          <div class="flex flex-col gap-2">
            <button onclick={() => location.reload()} class="btn btn-primary w-full">Reintentar</button>
            <button onclick={() => authStore.logout()} class="text-sm text-slate-400 hover:text-slate-600 transition">Cerrar sesión</button>
          </div>
        </div>

      {:else if bloqueado}
        <div class="card p-8 max-w-md w-full text-center space-y-6">
          <div class="w-20 h-20 bg-green-50 text-brand-green rounded-full flex items-center justify-center mx-auto">
            <svg class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <div>
            <h2 class="text-2xl font-black text-slate-900 tracking-tight">EXAMEN ENTREGADO</h2>
            <p class="text-slate-500 mt-2 font-medium">Tu evaluación ha sido registrada.</p>
          </div>
          <div class="py-4 border-y border-slate-100 space-y-1">
            <p class="text-xs text-slate-400 uppercase tracking-widest font-bold">Estudiante</p>
            <p class="text-sm text-slate-700 font-bold">{authStore.user?.email}</p>
            {#if examenStore.nivel}
              <p class="text-xs text-brand-green font-bold bg-green-50 inline-block px-3 py-1 rounded-full mt-2">{etiquetaNivel(examenStore.nivel)}</p>
            {/if}
          </div>
          <button onclick={() => authStore.logout()} class="btn btn-outline w-full">Cerrar sesión</button>
        </div>

      {:else if !autorizado}
        <div class="card p-8 max-w-sm w-full text-center space-y-5">
          <img src="{base}/logo.webp" alt="Logo UNESUM" class="h-14 object-contain mx-auto" />

          <div class="space-y-1">
            {#if examenStore.nombreEstudiante}
              <p class="text-base font-bold text-slate-800">{examenStore.nombreEstudiante}</p>
            {/if}
            <p class="text-xs text-slate-400">{authStore.user?.email}</p>
          </div>

          <div class="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
            <svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/>
            </svg>
          </div>

          <div>
            <h3 class="text-lg font-bold text-slate-900">Acceso no habilitado</h3>
            <p class="text-slate-500 text-sm mt-2 leading-relaxed">
              {#if examenStore.examenDeshabilitado}
                El sistema se habilitará en el horario programado.
              {:else}
                No tienes un examen asignado. Contacta a coordinación académica.
              {/if}
            </p>
          </div>

          <button onclick={() => authStore.logout()} class="btn btn-outline w-full">
            Cerrar sesión
          </button>
        </div>

      {:else}
        <!-- Welcome Screen -->
        <div class="text-center mb-10 space-y-5">
          <img src="{base}/logo.webp" alt="Logo UNESUM" class="h-20 object-contain mx-auto drop-shadow-md" />
          <div class="space-y-2">
            <h1 class="text-3xl font-black text-slate-900 tracking-tight">EVALUACIÓN ACADÉMICA</h1>
            <div class="inline-block bg-white/60 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/50 shadow-sm">
              {#if examenStore.nombreEstudiante}
                <p class="text-sm font-black text-slate-800 uppercase tracking-wide">{examenStore.nombreEstudiante}</p>
              {/if}
              <p class="text-slate-500 text-[11px] font-bold tracking-widest">{authStore.user?.email}</p>
            </div>
          </div>
        </div>

        <div class="card p-8 max-w-md w-full space-y-8 bg-white/90 backdrop-blur-sm">
          <div class="text-center space-y-4">
            {#if examenStore.nivel}
              <span class="inline-block bg-brand-red text-white text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-[0.2em] shadow-sm">{etiquetaNivel(examenStore.nivel)}</span>
            {/if}
            <div>
              <p class="text-2xl font-black text-slate-900">{enCurso ? 'EXAMEN EN CURSO' : 'LISTO PARA COMENZAR'}</p>
              <p class="text-sm text-slate-500 mt-1 font-medium">
                {#if enCurso}Progreso: <span class="text-brand-green font-bold">{examenStore.preguntasRespondidas}</span> / {examenStore.preguntas.length}{:else}{examenStore.preguntas.length} preguntas asignadas{/if}
              </p>
            </div>
            {#if enCurso}
              <div class="bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200">
                <div class="bg-brand-green h-full rounded-full transition-all duration-1000" style="width: {(examenStore.preguntasRespondidas / examenStore.preguntas.length) * 100}%"></div>
              </div>
            {/if}
          </div>

          <div class="space-y-3">
            <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest">Instrucciones</h3>
            <div class="grid gap-3 text-xs text-slate-600 font-medium">
              <div class="flex items-center gap-3 p-3 bg-brand-gray rounded-xl border border-slate-100">
                <div class="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-brand-green shadow-sm shrink-0"><svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M5 13l4 4L19 7" stroke-width="3"/></svg></div>
                <p>Guardado automático instantáneo.</p>
              </div>
              <div class="flex items-center gap-3 p-3 bg-brand-gray rounded-xl border border-slate-100">
                <div class="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-brand-orange shadow-sm shrink-0"><svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke-width="2.5"/></svg></div>
                <p>Finaliza automáticamente al agotarse el tiempo.</p>
              </div>
            </div>
          </div>

          <button onclick={abrirExamen} class="w-full btn btn-primary py-5 text-lg font-black tracking-tight shadow-lg active:translate-y-1">
            {enCurso ? 'RETOMAR EXAMEN' : 'INICIAR EXAMEN'}
          </button>
          <button onclick={() => authStore.logout()} class="w-full mt-2 text-xs font-bold text-slate-400 hover:text-brand-red transition-colors uppercase tracking-widest">Cerrar sesión</button>
        </div>
      {/if}

      <!-- GLOBAL FOOTER (Visible on all screens EXCEPT active exam) -->
      <footer class="mt-12 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] border-t border-slate-200/50 pt-4 text-center w-full max-w-sm">
        BY: <span class="text-slate-800">PAUL.AMEN@UNESUM.EDU.EC</span>
      </footer>
    </div>

  {:else}
    <!-- Active Exam Interface -->
    <header class="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all duration-300">
      <div class="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2 mb-1">
            {#if examenStore.nivel}
              <span class="text-[10px] font-black text-white bg-brand-red px-2 py-0.5 rounded-md uppercase tracking-[0.2em] shadow-sm">
                {etiquetaNivel(examenStore.nivel)}
              </span>
            {/if}
            {#if examenStore.nombreEstudiante}
              <span class="text-xs font-black text-slate-800 truncate uppercase tracking-tight">{examenStore.nombreEstudiante}</span>
            {/if}
          </div>
          <p class="text-[10px] text-slate-400 font-bold truncate uppercase tracking-widest">{authStore.user?.email}</p>
        </div>
        
        <div class="flex items-center gap-3 shrink-0">
          <IndicadorGuardado />
          <div class="w-px h-8 bg-slate-100 hidden sm:block"></div>
          <Temporizador />
        </div>
      </div>

      <!-- Barra de progreso -->
      <div class="bg-slate-100 h-2 relative overflow-hidden">
        <div
          class="bg-brand-green h-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(2,89,24,0.4)]"
          style="width: {examenStore.preguntas.length > 0 ? (examenStore.preguntasRespondidas / examenStore.preguntas.length) * 100 : 0}%"
        ></div>
      </div>
      <div class="max-w-3xl mx-auto px-4 py-2 flex justify-between items-center bg-slate-50/50 backdrop-blur-sm border-b border-slate-100">
        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          PROGRESO: <span class="text-brand-green">{examenStore.preguntasRespondidas}</span> <span class="text-slate-300">/</span> {examenStore.preguntas.length}
        </p>
        {#if !online}
          <span class="text-[10px] font-black text-brand-orange animate-pulse flex items-center gap-1">
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            OFFLINE
          </span>
        {/if}
      </div>
    </header>

    <main class="max-w-3xl mx-auto px-4 py-8 space-y-8 pb-40">
      {#each preguntasPagina as pregunta, i (pregunta.ID_Pregunta)}
        {@const indiceGlobal = paginaActual * PREGUNTAS_POR_PAGINA + i}
        <PreguntaRenderer {pregunta} indice={indiceGlobal} respuesta={examenStore.respuestas[String(indiceGlobal)]} onRespuesta={(idx, valor) => examenStore.guardarRespuesta(idx, valor)} disabled={false} />
      {/each}
    </main>

    <div class="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 shadow-[0_-8px_30px_rgba(0,0,0,0.04)]">
      <div class="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
        <button onclick={() => irAPagina(paginaActual - 1)} disabled={paginaActual === 0} class="flex items-center justify-center w-12 h-12 rounded-xl border-2 border-slate-100 text-slate-400 hover:text-brand-red hover:border-brand-red/20 hover:bg-brand-red/5 disabled:opacity-20 transition-all"><svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M15 19l-7-7 7-7"/></svg></button>
        <div class="flex-1 flex flex-col items-center">
          <div class="flex gap-1.5">
            {#each Array(totalPaginas) as _, i}<div class="w-2 h-2 rounded-full transition-all duration-300 {i === paginaActual ? 'bg-brand-red w-4' : 'bg-slate-200'}"></div>{/each}
          </div>
          <span class="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-widest">PÁGINA {paginaActual + 1} DE {totalPaginas}</span>
        </div>
        {#if esUltimaPagina}
          <button onclick={() => (confirmando = true)} disabled={examenStore.guardando} class="flex-1 btn btn-primary py-3.5 shadow-lg shadow-brand-red/20 font-black text-sm tracking-tight">{examenStore.guardando ? 'GUARDANDO…' : 'FINALIZAR EXAMEN'}</button>
        {:else}
          <button onclick={() => irAPagina(paginaActual + 1)} class="flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900 text-white hover:bg-brand-red shadow-lg transition-all"><svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M9 5l7 7-7 7"/></svg></button>
        {/if}
      </div>
    </div>
  {/if}
</div>

{#if confirmando}
  <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4" role="dialog" aria-modal="true">
    <div class="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full space-y-6 animate-in fade-in zoom-in duration-300 slide-in-from-bottom-8 sm:slide-in-from-bottom-0">
      <div class="w-16 h-16 bg-brand-red/10 text-brand-red rounded-2xl flex items-center justify-center mx-auto rotate-3"><svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/></svg></div>
      <div class="text-center space-y-2">
        <h2 class="text-2xl font-black text-slate-900 tracking-tight uppercase">¿Entregar examen?</h2>
        <p class="text-slate-500 font-medium text-sm">Has completado <span class="text-brand-green font-bold">{examenStore.preguntasRespondidas}</span> de {examenStore.preguntas.length} preguntas.</p>
      </div>
      {#if sinResponder > 0}<div class="bg-brand-orange/10 border-2 border-brand-orange/20 rounded-2xl p-4 text-sm text-brand-orange font-bold leading-tight flex gap-3"><svg class="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg><p>TIENES {sinResponder} PREGUNTAS SIN RESPONDER. SE CALIFICARÁN COMO INCORRECTAS.</p></div>{/if}
      <p class="text-[11px] text-slate-400 text-center font-bold uppercase tracking-widest leading-relaxed">Esta acción es irreversible. Una vez entregado no podrás realizar cambios.</p>
      <div class="grid grid-cols-2 gap-3 pt-2">
        <button onclick={() => (confirmando = false)} class="btn btn-outline py-4 font-black text-xs tracking-widest uppercase">Volver</button>
        <button onclick={confirmarEntrega} disabled={examenStore.guardando} class="btn btn-primary bg-slate-900 hover:bg-brand-red py-4 font-black text-xs tracking-widest uppercase shadow-xl">{examenStore.guardando ? 'Guardando…' : 'SÍ, ENTREGAR'}</button>
      </div>
    </div>
  </div>
{/if}

<style>
  :global(body) { overscroll-behavior-y: none; }
</style>
