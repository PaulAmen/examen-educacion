import { browser } from '$app/environment';
import { supabase } from '$lib/supabase';

// ─── Tipos que reflejan la estructura REAL del JSONB en producción ─────────────
//     Los nombres de campo coinciden exactamente con la tabla `tabla_preguntas`.

export type TipoPregunta =
  | 'Opción Múltiple'
  | 'Verdadero o Falso'
  | 'Unir con Líneas'
  | 'Casos de Uso';

export interface Pregunta {
  ID_Pregunta: string;
  Tipo_Pregunta: TipoPregunta;
  Materia?: string;
  Tema?: string;
  Enunciado: string;
  /** Opción A (Múltiple / Caso de Uso) ó Concepto 1 (Unir con Líneas) */
  Opcion_A_o_Concepto1?: string;
  /** Opción B (Múltiple / Caso de Uso) ó Definición 1 (Unir con Líneas) */
  Opcion_B_o_Definicion1?: string;
  /** Opción C (Múltiple / Caso de Uso) ó Concepto 2 (Unir con Líneas) */
  Opcion_C_o_Concepto2?: string;
  /** Opción D (Múltiple / Caso de Uso) ó Definición 2 (Unir con Líneas) */
  Opcion_D_o_Definicion2?: string;
  Concepto3?: string;
  Definicion3?: string;
  Concepto4?: string;
  Definicion4?: string;
  /** Presente en el JSONB para que calificar.js compare respuestas */
  Respuesta_Correcta?: string;
  /** Justificación modelo para que DeepSeek evalúe las justificaciones libres */
  Justificacion?: string;
}

// ─── Estructura de respuestas (compatible con scripts/calificar.js) ────────────
//
//   La clave es el ÍNDICE de la pregunta como string: "0", "1", "2"...
//   Esto permite que calificar.js itere con: respuestas[String(i)]
//
//   Opción Múltiple:   { respuesta: "A" }
//   Casos de Uso:      { respuesta: "B", justificacion: "texto libre" }
//   Verdadero o Falso: { respuesta: "Verdadero", justificacion: "texto libre" }
//   Unir con Líneas:   { "Concepto1": "Def3", "Concepto2": "Def1", ... }
//                       ↑ clave = nombre del concepto (Concepto1..4), valor = texto definición

export interface RespuestaConRespuesta {
  respuesta?: string;
  justificacion?: string;
}
// Unir con Líneas usa claves "Concepto1".."Concepto4" — NO tiene clave "respuesta"
export type RespuestaUnir = Record<string, string>;
export type RespuestaValor = RespuestaConRespuesta | RespuestaUnir;

export type EstadoExamen = 'pendiente' | 'en_curso' | 'finalizado';

// ─── Constantes ────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'examen_respuestas';
const DEBOUNCE_MS = 1500; // igual que el código original

// ─── Store global ─────────────────────────────────────────────────────────────
class ExamenStore {
  examenId = $state<string | null>(null);
  emailEstudiante = $state<string | null>(null);
  nivel = $state<4 | 8 | null>(null);
  preguntas = $state<Pregunta[]>([]);
  /** Claves: String(indice) → compatible con calificar.js */
  respuestas = $state<Record<string, RespuestaValor>>({});
  estado = $state<EstadoExamen>('pendiente');
  horaCierre = $state<Date | null>(null);
  tiempoRestante = $state<number>(0);
  cargando = $state(true);
  error = $state<string | null>(null);
  guardando = $state(false);
  sinExamen = $state(false);
  examenDeshabilitado = $state(false);

  tiempoFormateado = $derived.by(() => {
    const t = this.tiempoRestante;
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = t % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  });

  /** Cantidad de preguntas con alguna respuesta registrada */
  preguntasRespondidas = $derived.by(() => {
    return this.preguntas.filter((_, i) => {
      const r = this.respuestas[String(i)];
      if (!r || typeof r !== 'object') return false;
      if ('respuesta' in r) return Boolean(r.respuesta);
      return Object.keys(r).length > 0;
    }).length;
  });

  #debounceTimer: ReturnType<typeof setTimeout> | null = null;
  #intervalId: ReturnType<typeof setInterval> | null = null;

  // ── Inicialización ──────────────────────────────────────────────────────────

  async inicializar(email: string) {
    if (!browser) return;
    this.cargando = true;
    this.error = null;
    this.emailEstudiante = email;

    try {
      // 1. Verificar configuración global
      const { data: config, error: errConfig } = await supabase
        .from('configuracion_examen')
        .select('habilitado, emails_beta, hora_cierre')
        .single();

      if (errConfig) throw errConfig;

      const emailEnBeta = config.emails_beta.includes(email);
      if (!config.habilitado && !emailEnBeta) {
        this.examenDeshabilitado = true;
        return;
      }

      if (config.hora_cierre) {
        this.horaCierre = new Date(config.hora_cierre);
      }

      // 2. Obtener examen asignado
      const { data: examen, error: errExamen } = await supabase
        .from('examenes_asignados')
        .select('*')
        .eq('email_estudiante', email)
        .single();

      if (errExamen || !examen) {
        this.sinExamen = true;
        return;
      }

      this.examenId = examen.id_examen;
      this.nivel = examen.nivel as 4 | 8;
      this.preguntas = (examen.preguntas_asignadas as Pregunta[]) ?? [];
      this.estado = examen.estado as EstadoExamen;

      // 3. Rehidratación: merge(localStorage, Supabase) — Supabase gana en conflictos
      const respuestasDB = (examen.respuestas_estudiante as Record<string, RespuestaValor>) ?? {};
      const respuestasLocal = this.#leerLocal(examen.id_examen) ?? {};
      const merged = { ...respuestasLocal, ...respuestasDB };

      this.respuestas = merged;
      this.#guardarLocal(merged);

      if (Object.keys(merged).length > Object.keys(respuestasDB).length) {
        void this.#syncSupabase();
      }

      // 4. Iniciar temporizador si hay hora de cierre
      if (this.horaCierre) {
        this.#iniciarTemporizador();
      }

      // 5. Marcar como en_curso si estaba pendiente
      const examenId = this.examenId!;
      if (this.estado === 'pendiente') {
        await supabase
          .from('examenes_asignados')
          .update({ estado: 'en_curso' })
          .eq('id_examen', examenId);
        this.estado = 'en_curso';
      }
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Error al cargar el examen';
    } finally {
      this.cargando = false;
    }
  }

  // ── API pública ─────────────────────────────────────────────────────────────

  /**
   * Guarda la respuesta de una pregunta usando su ÍNDICE como clave.
   * Indice = posición en el array preguntas_asignadas (0-based).
   * Compatible con scripts/calificar.js.
   */
  guardarRespuesta(indice: number, valor: RespuestaValor) {
    if (this.estado === 'finalizado') return;
    this.respuestas = { ...this.respuestas, [String(indice)]: valor };
    this.#guardarLocal(this.respuestas);
    this.#debounce();
  }

  /**
   * Entrega definitiva: guarda respuestas finales y cambia estado a 'finalizado'.
   * Acción irreversible.
   */
  async entregarExamen() {
    const examenId = this.examenId;
    if (!examenId || this.estado === 'finalizado') return;

    this.guardando = true;

    // Cancelar cualquier debounce pendiente
    if (this.#debounceTimer) {
      clearTimeout(this.#debounceTimer);
      this.#debounceTimer = null;
    }

    const { error } = await supabase
      .from('examenes_asignados')
      .update({
        respuestas_estudiante: this.respuestas,
        estado: 'finalizado'
      })
      .eq('id_examen', examenId);

    this.guardando = false;

    if (error) {
      this.error = `Error al entregar el examen: ${error.message}`;
    } else {
      this.estado = 'finalizado';
      if (this.#intervalId) clearInterval(this.#intervalId);
    }
  }

  destroy() {
    if (this.#intervalId) clearInterval(this.#intervalId);
    if (this.#debounceTimer) clearTimeout(this.#debounceTimer);
  }

  // ── Privados ────────────────────────────────────────────────────────────────

  #leerLocal(examenId?: string): Record<string, RespuestaValor> | null {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY}_${examenId ?? this.examenId}`);
      return raw ? (JSON.parse(raw) as Record<string, RespuestaValor>) : null;
    } catch {
      return null;
    }
  }

  #guardarLocal(data: Record<string, RespuestaValor>) {
    if (!this.examenId) return;
    try {
      localStorage.setItem(`${STORAGE_KEY}_${this.examenId}`, JSON.stringify(data));
    } catch {
      // localStorage lleno — los datos siguen en $state
    }
  }

  #debounce() {
    if (this.#debounceTimer) clearTimeout(this.#debounceTimer);
    this.#debounceTimer = setTimeout(() => void this.#syncSupabase(), DEBOUNCE_MS);
  }

  async #syncSupabase() {
    const examenId = this.examenId;
    if (!examenId) return;
    this.guardando = true;
    try {
      const { error } = await supabase
        .from('examenes_asignados')
        .update({ respuestas_estudiante: this.respuestas })
        .eq('id_examen', examenId);

      if (error) console.warn('[ExamenStore] Autoguardado fallido:', error.message);
    } finally {
      this.guardando = false;
    }
  }

  #iniciarTemporizador() {
    if (this.#intervalId) clearInterval(this.#intervalId);

    const tick = () => {
      if (!this.horaCierre) return;
      const diff = Math.floor((this.horaCierre.getTime() - Date.now()) / 1000);
      this.tiempoRestante = Math.max(0, diff);
      if (diff <= 0) void this.#finalizarPorTiempo();
    };

    tick();
    this.#intervalId = setInterval(tick, 1000);
  }

  async #finalizarPorTiempo() {
    if (this.#intervalId) clearInterval(this.#intervalId);
    if (this.estado === 'finalizado') return;

    this.estado = 'finalizado';

    if (this.#debounceTimer) {
      clearTimeout(this.#debounceTimer);
      this.#debounceTimer = null;
    }

    const examenId = this.examenId;
    if (!examenId) return;

    await supabase
      .from('examenes_asignados')
      .update({
        estado: 'finalizado',
        respuestas_estudiante: this.respuestas
      })
      .eq('id_examen', examenId);
  }
}

export const examenStore = new ExamenStore();
