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

<div class="flex items-center justify-center min-h-screen bg-brand-gray px-4 font-sans">
  {#if error}
    <div class="card p-10 max-w-sm w-full text-center space-y-6">
      <div class="w-20 h-20 bg-brand-red/10 text-brand-red rounded-full flex items-center justify-center mx-auto rotate-12 transition-transform hover:rotate-0 duration-500">
        <svg class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
        </svg>
      </div>
      <div class="space-y-2">
        <h2 class="text-2xl font-black text-slate-900 tracking-tight uppercase">Error de acceso</h2>
        <p class="text-slate-500 text-sm font-medium leading-relaxed">{error}</p>
      </div>
      <a href="{base}/" class="btn btn-primary block py-3.5 font-black text-xs tracking-widest uppercase">
        Volver al inicio
      </a>
    </div>
  {:else}
    <div class="text-center space-y-4">
      <div class="relative w-16 h-16 mx-auto">
        <div class="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
        <div class="absolute inset-0 border-4 border-brand-red border-t-transparent rounded-full animate-spin"></div>
      </div>
      <p class="text-slate-500 font-black text-[10px] uppercase tracking-[0.3em] animate-pulse">Completando autenticación…</p>
    </div>
  {/if}
</div>
