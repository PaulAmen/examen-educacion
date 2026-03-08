<script lang="ts">
  import { onDestroy } from 'svelte';
  import { authStore, DOMINIO_INSTITUCIONAL } from '$lib/auth.svelte.js';
  import { examenStore } from '$lib/state/examen.svelte.js';
  import PreguntaRenderer from '$lib/components/PreguntaRenderer.svelte';
  import Temporizador from '$lib/components/Temporizador.svelte';
  import IndicadorGuardado from '$lib/components/IndicadorGuardado.svelte';

  const PREGUNTAS_POR_PAGINA = 10;

  let inicializado = $state(false);
  let confirmando = $state(false);
  let paginaActual = $state(0);

  // Cuando el usuario esté autenticado, inicializar el examen
  $effect(() => {
    if (authStore.user && !authStore.loading && !inicializado) {
      inicializado = true;
      examenStore.inicializar(authStore.user.email!);
    }
  });

  onDestroy(() => examenStore.destroy());

  const bloqueado = $derived(examenStore.estado === 'finalizado');
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

<div class="min-h-screen bg-gray-50">

  <!-- ── Cargando Auth ─────────────────────────────────────────────────────── -->
  {#if authStore.loading}
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center space-y-3">
        <div class="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p class="text-gray-500 text-sm">Verificando sesión…</p>
      </div>
    </div>

  <!-- ── Error de dominio ───────────────────────────────────────────────────── -->
  {:else if authStore.errorDominio}
    <div class="flex items-center justify-center min-h-screen px-4">
      <div class="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center space-y-4">
        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <svg class="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
          </svg>
        </div>
        <h2 class="text-xl font-bold text-gray-900">Acceso denegado</h2>
        <p class="text-gray-500 text-sm">
          Solo se permiten cuentas institucionales <strong>{DOMINIO_INSTITUCIONAL}</strong>
        </p>
        <button
          onclick={() => authStore.loginConGoogle()}
          class="w-full border border-gray-200 text-gray-700 font-medium py-2.5 px-4 rounded-xl hover:bg-gray-50 transition text-sm"
        >
          Intentar con otra cuenta
        </button>
      </div>
    </div>

  <!-- ── Sin sesión — Login ─────────────────────────────────────────────────── -->
  {:else if !authStore.user}
    <div class="flex flex-col items-center justify-center min-h-screen px-4">
      <div class="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center space-y-5">
        <img
          src="https://www.unesum.edu.ec/wp-content/uploads/2019/04/logo-unesum.png"
          alt="Logo UNESUM"
          class="h-16 object-contain mx-auto"
        />
        <div class="space-y-1">
          <h1 class="text-2xl font-bold text-gray-900">Evaluación Académica</h1>
          <p class="text-gray-500 text-sm">Sistema de exámenes — UNESUM</p>
        </div>
        <p class="text-gray-400 text-xs">
          Ingresa con tu cuenta institucional<br>
          <strong class="text-gray-600">{DOMINIO_INSTITUCIONAL}</strong>
        </p>
        <button
          onclick={() => authStore.loginConGoogle()}
          class="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 hover:border-blue-400 text-gray-700 font-medium py-3 px-4 rounded-xl transition-all hover:shadow-md"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Ingresar con Google
        </button>
      </div>
    </div>

  <!-- ── Cargando examen ────────────────────────────────────────────────────── -->
  {:else if examenStore.cargando}
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center space-y-3">
        <div class="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p class="text-gray-500 text-sm">Cargando tu examen…</p>
      </div>
    </div>

  <!-- ── Examen deshabilitado (aún no es el día) ───────────────────────────── -->
  {:else if examenStore.examenDeshabilitado}
    <div class="flex items-center justify-center min-h-screen px-4">
      <div class="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center space-y-4">
        <div class="text-5xl">🔒</div>
        <h2 class="text-xl font-bold text-gray-900">Evaluación no disponible</h2>
        <p class="text-gray-500 text-sm">El sistema de evaluación aún no está habilitado.</p>
        <p class="text-gray-400 text-xs">
          Ingresado como <strong class="text-gray-600">{authStore.user?.email}</strong><br>
          El acceso se habilitará el día del examen.
        </p>
        <button onclick={() => authStore.logout()} class="text-sm text-blue-600 hover:underline">
          Cerrar sesión
        </button>
      </div>
    </div>

  <!-- ── Sin examen asignado ───────────────────────────────────────────────── -->
  {:else if examenStore.sinExamen}
    <div class="flex items-center justify-center min-h-screen px-4">
      <div class="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center space-y-4">
        <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
          <svg class="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15"/>
          </svg>
        </div>
        <h2 class="text-xl font-bold text-gray-900">Sin examen asignado</h2>
        <p class="text-gray-500 text-sm">
          No hay examen registrado para <strong>{authStore.user?.email}</strong>.<br>
          Contacta al administrador del sistema.
        </p>
        <button onclick={() => authStore.logout()} class="text-sm text-blue-600 hover:underline">
          Cerrar sesión
        </button>
      </div>
    </div>

  <!-- ── Error de carga ────────────────────────────────────────────────────── -->
  {:else if examenStore.error}
    <div class="flex items-center justify-center min-h-screen px-4">
      <div class="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center space-y-4">
        <h2 class="text-xl font-bold text-red-600">Error</h2>
        <p class="text-gray-500 text-sm">{examenStore.error}</p>
        <div class="flex gap-3 justify-center">
          <button onclick={() => location.reload()} class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
            Reintentar
          </button>
          <button onclick={() => authStore.logout()} class="text-sm text-gray-500 hover:underline self-center">
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>

  <!-- ── Examen entregado (finalizado) ─────────────────────────────────────── -->
  {:else if bloqueado}
    <div class="flex items-center justify-center min-h-screen px-4">
      <div class="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center space-y-4">
        <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <svg class="w-9 h-9 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <h2 class="text-2xl font-bold text-gray-900">Examen entregado</h2>
        <p class="text-gray-500">Tu evaluación ha sido registrada correctamente.</p>
        <p class="text-sm text-gray-400">
          <strong class="text-gray-600">{authStore.user?.email}</strong>
          {#if examenStore.nivel} — {etiquetaNivel(examenStore.nivel)}{/if}
        </p>
        <p class="text-xs text-gray-400">
          La calificación estará disponible una vez que el sistema la procese.
        </p>
        <button onclick={() => authStore.logout()} class="text-sm text-blue-600 hover:underline">
          Cerrar sesión
        </button>
      </div>
    </div>

  <!-- ── Interfaz principal del examen ─────────────────────────────────────── -->
  {:else}
    <!-- Header sticky -->
    <header class="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div class="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-blue-700 uppercase tracking-wide">
              {#if examenStore.nivel}{etiquetaNivel(examenStore.nivel)}{/if}
            </span>
          </div>
          <p class="text-xs text-gray-400 truncate">{authStore.user?.email}</p>
        </div>
        <div class="flex items-center gap-3 shrink-0">
          <IndicadorGuardado />
          <Temporizador />
          <button
            onclick={() => authStore.logout()}
            class="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg px-2.5 py-1.5 hover:bg-gray-50 transition"
          >
            Salir
          </button>
        </div>
      </div>

      <!-- Barra de progreso -->
      <div class="bg-gray-100 h-1.5">
        <div
          class="bg-green-500 h-1.5 transition-all duration-500"
          style="width: {examenStore.preguntas.length > 0
            ? (examenStore.preguntasRespondidas / examenStore.preguntas.length) * 100
            : 0}%"
        ></div>
      </div>
      <div class="max-w-2xl mx-auto px-4 pb-2">
        <p class="text-xs text-gray-400">
          {examenStore.preguntasRespondidas} de {examenStore.preguntas.length} preguntas respondidas
        </p>
      </div>
    </header>

    <!-- Lista de preguntas (página actual) -->
    <main class="max-w-2xl mx-auto px-4 py-6 space-y-5 pb-32">
      {#each preguntasPagina as pregunta, i (pregunta.ID_Pregunta)}
        {@const indiceGlobal = paginaActual * PREGUNTAS_POR_PAGINA + i}
        <PreguntaRenderer
          {pregunta}
          indice={indiceGlobal}
          respuesta={examenStore.respuestas[String(indiceGlobal)]}
          onRespuesta={(idx, valor) => examenStore.guardarRespuesta(idx, valor)}
          disabled={false}
        />
      {/each}

      {#if examenStore.preguntas.length === 0}
        <div class="text-center py-12 text-gray-400 text-sm">
          No hay preguntas cargadas en este examen.
        </div>
      {/if}
    </main>

    <!-- Barra de navegación fija al fondo -->
    <div class="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg">
      <div class="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
        <!-- Anterior -->
        <button
          onclick={() => irAPagina(paginaActual - 1)}
          disabled={paginaActual === 0}
          class="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          ← Ant.
        </button>

        <!-- Indicador central -->
        <div class="flex-1 text-center text-sm text-gray-500">
          <span class="font-semibold text-gray-800">{paginaActual + 1}</span>
          <span class="text-gray-400"> / {totalPaginas}</span>
        </div>

        <!-- Siguiente o Entregar -->
        {#if esUltimaPagina}
          <button
            onclick={() => (confirmando = true)}
            disabled={examenStore.guardando}
            class="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-xl transition-colors text-sm"
          >
            {examenStore.guardando ? 'Guardando…' : 'Entregar examen'}
          </button>
        {:else}
          <button
            onclick={() => irAPagina(paginaActual + 1)}
            class="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition"
          >
            Sig. →
          </button>
        {/if}
      </div>
    </div>
  {/if}
</div>

<!-- ── Modal de confirmación de entrega ───────────────────────────────────── -->
{#if confirmando}
  <div
    class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="titulo-confirmacion"
  >
    <div class="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full space-y-4">
      <h2 id="titulo-confirmacion" class="text-xl font-bold text-gray-900 text-center">
        ¿Entregar examen?
      </h2>

      <p class="text-gray-600 text-sm text-center">
        Has respondido <strong>{examenStore.preguntasRespondidas}</strong>
        de <strong>{examenStore.preguntas.length}</strong> preguntas.
      </p>

      {#if sinResponder > 0}
        <div class="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
          <strong>Atención:</strong> tienes {sinResponder} {sinResponder === 1 ? 'pregunta' : 'preguntas'} sin responder.
          Las preguntas sin respuesta cuentan como incorrectas.
          Las de Verdadero/Falso sin justificación pierden el 30% del puntaje.
        </div>
      {/if}

      <p class="text-xs text-gray-400 text-center">
        Esta acción es <strong>irreversible</strong>. Una vez entregado no podrás modificar tus respuestas.
      </p>

      <div class="grid grid-cols-2 gap-3 pt-2">
        <button
          onclick={() => (confirmando = false)}
          class="py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition"
        >
          Cancelar
        </button>
        <button
          onclick={confirmarEntrega}
          disabled={examenStore.guardando}
          class="py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 disabled:opacity-60 transition"
        >
          {examenStore.guardando ? 'Guardando…' : 'Sí, entregar'}
        </button>
      </div>
    </div>
  </div>
{/if}
