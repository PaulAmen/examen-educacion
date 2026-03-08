import { browser } from '$app/environment';
import { base } from '$app/paths';
import type { User } from '@supabase/supabase-js';
import { supabase, esDominioValido, DOMINIO_INSTITUCIONAL } from '$lib/supabase';

class AuthStore {
  user = $state<User | null>(null);
  loading = $state(true);
  /** true cuando el usuario se autenticó con un correo fuera del dominio institucional */
  errorDominio = $state(false);

  async inicializar() {
    if (!browser) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      if (!esDominioValido(session.user.email)) {
        await supabase.auth.signOut();
        this.errorDominio = true;
      } else {
        this.user = session.user;
      }
    }
    this.loading = false;

    supabase.auth.onAuthStateChange(async (_, session) => {
      if (session) {
        if (!esDominioValido(session.user.email)) {
          await supabase.auth.signOut();
          this.errorDominio = true;
          this.user = null;
        } else {
          this.errorDominio = false;
          this.user = session.user;
        }
      } else {
        this.user = null;
      }
    });
  }

  async loginConGoogle() {
    this.errorDominio = false;
    const redirectTo = `${window.location.origin}${base}/auth/callback`;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        // Pista al selector de cuentas de Google para mostrar solo cuentas institucionales
        queryParams: { hd: 'unesum.edu.ec' }
      }
    });
  }

  async logout() {
    await supabase.auth.signOut();
    this.user = null;
    this.errorDominio = false;
  }
}

export const authStore = new AuthStore();
export { DOMINIO_INSTITUCIONAL };
