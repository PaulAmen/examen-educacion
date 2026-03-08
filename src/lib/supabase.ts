import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// ─── Dominio institucional ────────────────────────────────────────────────────
export const DOMINIO_INSTITUCIONAL = '@unesum.edu.ec';

export function esDominioValido(email: string | null | undefined): boolean {
  return typeof email === 'string' && email.endsWith(DOMINIO_INSTITUCIONAL);
}

// ─── Tipos que reflejan el esquema en producción ──────────────────────────────
export interface ConfiguracionExamen {
  id: true;
  habilitado: boolean;
  emails_beta: string[];
  hora_cierre: string | null;
}

export interface ExamenAsignado {
  id_examen: string;
  email_estudiante: string;
  nivel: 4 | 8;
  estado: 'pendiente' | 'en_curso' | 'finalizado';
  preguntas_asignadas: unknown;
  respuestas_estudiante: unknown;
  calificacion_final: number | null;
  created_at: string;
  updated_at: string;
}

// ─── Cliente Supabase ─────────────────────────────────────────────────────────
// Se usa createClient<any> para evitar inferencia incorrecta de tipos en queries.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = createClient<any>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      flowType: 'pkce',
      persistSession: true,
      autoRefreshToken: true,
      // false: evita que el cliente auto-intercambie el code PKCE al cargar cualquier página.
      // El intercambio se hace manualmente en src/routes/auth/callback/+page.svelte
      detectSessionInUrl: false
    }
  }
);
