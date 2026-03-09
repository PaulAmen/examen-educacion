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
//   Casos de Uso:      { respuesta: "B" }
//   Verdadero o Falso: { respuesta: "Falso", justificacion: "texto libre" }
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
const DEBOUNCE_MS = 1500;
const DURACION_EXAMEN_MS = 2 * 60 * 60 * 1000; // 2 horas
const POLLING_MS = 60_000; // verificar cierre admin cada 60 s

// ─── Store global ─────────────────────────────────────────────────────────────
class ExamenStore {
  examenId = $state<string | null>(null);
  emailEstudiante = $state<string | null>(null);
  nombreEstudiante = $state<string | null>(null);
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
  #pollingId: ReturnType<typeof setInterval> | null = null;

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
        // Continuar para cargar el nombre del estudiante aunque esté deshabilitado
      }

      // 2. Obtener examen asignado
      const { data: examen, error: errExamen } = await supabase
        .from('examenes_asignados')
        .select('*')
        .eq('email_estudiante', email)
        .single();

      if (errExamen || !examen) {
        if (!this.examenDeshabilitado) this.sinExamen = true;
        return;
      }

      // Guardar nombre siempre (se muestra en pantalla de bloqueo y bienvenida)
      this.nombreEstudiante = examen.nombre_estudiante ?? null;

      // Si está deshabilitado, no continuar con la carga del examen
      if (this.examenDeshabilitado) return;
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

      // 4. Calcular hora de cierre efectiva (la más temprana entre admin y estudiante)
      const cierreEstudiante = examen.hora_cierre ? new Date(examen.hora_cierre) : null;
      const cierreAdmin = config.hora_cierre ? new Date(config.hora_cierre) : null;

      if (cierreEstudiante && cierreAdmin) {
        this.horaCierre = cierreEstudiante < cierreAdmin ? cierreEstudiante : cierreAdmin;
      } else if (cierreEstudiante || cierreAdmin) {
        this.horaCierre = cierreEstudiante ?? cierreAdmin;
      } else if (this.estado === 'en_curso') {
        // Fallback: si ya está en curso pero no hay hora_cierre en DB,
        // asignar 2 horas desde ahora para que el temporizador no se quede vacío.
        this.horaCierre = new Date(Date.now() + DURACION_EXAMEN_MS);
      }

      // 5. Iniciar temporizador y polling si hay una hora de cierre definida
      if (this.horaCierre && (this.estado === 'en_curso' || this.estado === 'pendiente')) {
        this.#iniciarTemporizador();
        this.#iniciarPolling();
      }

    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Error al cargar el examen';
    } finally {
      this.cargando = false;
    }
  }

  // ── API pública ─────────────────────────────────────────────────────────────

  /**
   * Flush inmediato a Supabase: cancela el debounce pendiente y guarda ahora mismo.
   * Llamar desde visibilitychange (tab oculto) para evitar pérdida de datos en móvil.
   */
  async flushInmediato() {
    if (this.estado === 'finalizado' || !this.examenId) return;
    if (this.#debounceTimer) {
      clearTimeout(this.#debounceTimer);
      this.#debounceTimer = null;
    }
    await this.#syncSupabase();
  }

  /**
   * Marca el examen como en_curso, guarda hora_cierre = ahora + 2h y arranca el timer.
   * Solo actúa si el estado es 'pendiente'.
   */
  async iniciarExamen() {
    const examenId = this.examenId;
    if (!examenId || this.estado !== 'pendiente') return;

    // 1. Calcular hora de cierre (ahora + 2 horas)
    const localCierre = new Date(Date.now() + DURACION_EXAMEN_MS);

    // 2. Actualización OPTIMISTA: Reflejar en UI de inmediato
    this.estado = 'en_curso';
    
    // Si no hay cierre previo o el nuevo es más temprano, actualizar localmente
    if (!this.horaCierre || localCierre < this.horaCierre) {
      this.horaCierre = localCierre;
    }

    // 3. Arrancar motores visuales
    this.#iniciarTemporizador();
    this.#iniciarPolling();

    // 4. Sincronizar con base de datos en segundo plano
    try {
      const { error } = await supabase
        .from('examenes_asignados')
        .update({ 
          estado: 'en_curso', 
          hora_cierre: localCierre.toISOString() 
        })
        .eq('id_examen', examenId);

      if (error) throw error;
    } catch (e) {
      console.error('[ExamenStore] Error al iniciar examen en DB:', e);
      // Opcional: podrías revertir el estado si es crítico, 
      // pero para el estudiante es mejor que siga si ya empezó.
    }
  }

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
      if (this.#pollingId) clearInterval(this.#pollingId);
    }
  }

  destroy() {
    if (this.#intervalId) clearInterval(this.#intervalId);
    if (this.#debounceTimer) clearTimeout(this.#debounceTimer);
    if (this.#pollingId) clearInterval(this.#pollingId);
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

  /**
   * Polling cada 60s: detecta si el administrador cerró el examen desde la DB.
   * Dos mecanismos de cierre admin:
   *   1. Actualizar `configuracion_examen.hora_cierre` a una fecha pasada/cercana
   *   2. Poner `configuracion_examen.habilitado = false`
   */
  #iniciarPolling() {
    if (this.#pollingId) clearInterval(this.#pollingId);
    this.#pollingId = setInterval(() => void this.#verificarCierreAdmin(), POLLING_MS);
  }

  async #verificarCierreAdmin() {
    if (this.estado === 'finalizado') {
      if (this.#pollingId) clearInterval(this.#pollingId);
      return;
    }

    const { data: config } = await supabase
      .from('configuracion_examen')
      .select('habilitado, hora_cierre')
      .single();

    if (!config) return;

    // Admin deshabilitó — volver a pantalla de espera sin tocar la DB del estudiante
    if (!config.habilitado) {
      this.examenDeshabilitado = true;
      return;
    }

    // Admin re-habilitó — permitir retomar
    if (this.examenDeshabilitado) {
      this.examenDeshabilitado = false;
    }

    // Admin actualizó hora_cierre global a una hora más temprana
    if (config.hora_cierre) {
      const cierreAdmin = new Date(config.hora_cierre);
      if (!this.horaCierre || cierreAdmin < this.horaCierre) {
        this.horaCierre = cierreAdmin;
        // Si ya venció, cerrar de inmediato
        if (cierreAdmin <= new Date()) {
          void this.#finalizarPorTiempo();
        }
        // Si no, el temporizador ya activo usará el nuevo horaCierre en el próximo tick
      }
    }
  }

  async #finalizarPorTiempo() {
    if (this.#intervalId) clearInterval(this.#intervalId);
    if (this.#pollingId) clearInterval(this.#pollingId);
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
