<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { supabase } from '$lib/supabase';

  let error = $state<string | null>(null);

  onMount(async () => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');

    if (code) {
      // Intercambio manual del código PKCE (detectSessionInUrl=false en el cliente)
      const { error: err } = await supabase.auth.exchangeCodeForSession(code);
      if (err) {
        // El error más común: el usuario abrió el link de callback en otra pestaña/dispositivo.
        // En ese caso, verificamos si ya tiene sesión activa de todas formas.
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await goto(`${base}/`, { replaceState: true });
        } else {
          error = err.message;
        }
      } else {
        await goto(`${base}/`, { replaceState: true });
      }
    } else {
      // Sin code en la URL: verificar sesión existente (p. ej. recarga de la callback)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await goto(`${base}/`, { replaceState: true });
      } else {
        error = 'No se recibió el código de autenticación. Intenta iniciar sesión de nuevo.';
      }
    }
  });
</script>

<svelte:head>
  <title>Autenticando…</title>
</svelte:head>

<div class="flex items-center justify-center min-h-screen bg-gray-50 px-4">
  {#if error}
    <div class="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center space-y-4">
      <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
        <svg class="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
        </svg>
      </div>
      <h2 class="text-xl font-bold text-gray-900">Error de autenticación</h2>
      <p class="text-gray-500 text-sm">{error}</p>
      <a href="{base}/" class="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
        Volver al inicio
      </a>
    </div>
  {:else}
    <div class="text-center space-y-3">
      <div class="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
      <p class="text-gray-500 text-sm">Completando autenticación…</p>
    </div>
  {/if}
</div>
