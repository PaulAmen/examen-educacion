/**
 * scripts/calificar.js
 * =====================================================================
 * Califica todos los exámenes en estado 'finalizado' que aún no tienen
 * calificacion_final asignada, usando DeepSeek como modelo de IA.
 *
 * PREGUNTAS OBJETIVAS (calificación local, sin IA):
 *   - Opción Múltiple   → comparación exacta de letra (A/B/C/D)
 *   - Unir con Líneas   → crédito proporcional por par correcto
 *
 * PREGUNTAS CON JUSTIFICACIÓN (evaluadas con DeepSeek):
 *   - Verdadero o Falso → 70% por respuesta correcta + 30% por justificación válida
 *   - Casos de Uso      → ídem
 *
 * PUNTAJE:
 *   100 preguntas × 0.10 pts = nota máxima de 10.00
 *
 * COSTO ESTIMADO (DeepSeek-V3, ~$0.27/1M tokens input):
 *   330 estudiantes × ~40 justificaciones × ~500 tokens ≈ $2–3 USD total
 *
 * VARIABLES DE ENTORNO REQUERIDAS:
 *   DEEPSEEK_API_KEY          → clave de DeepSeek (platform.deepseek.com)
 *   VITE_SUPABASE_URL         → URL del proyecto Supabase
 *   SUPABASE_SERVICE_ROLE_KEY → service_role key (bypasa RLS)
 *
 * USO:
 *   DEEPSEEK_API_KEY=sk-... \
 *   VITE_SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=ey... \
 *   node scripts/calificar.js
 * =====================================================================
 */

import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// ─── Validar variables de entorno ─────────────────────────────────────────────
const DEEPSEEK_KEY   = process.env.DEEPSEEK_API_KEY;
const SUPABASE_URL   = process.env.VITE_SUPABASE_URL;
const SUPABASE_ADMIN = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!DEEPSEEK_KEY || !SUPABASE_URL || !SUPABASE_ADMIN) {
  console.error(
    'Error: faltan variables de entorno.\n' +
    'Necesarias: DEEPSEEK_API_KEY, VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY'
  );
  process.exit(1);
}

// ─── Clientes ─────────────────────────────────────────────────────────────────
const deepseek = new OpenAI({
  apiKey:  DEEPSEEK_KEY,
  baseURL: 'https://api.deepseek.com'
});
const supabase = createClient(SUPABASE_URL, SUPABASE_ADMIN);

// ─── Constantes de puntuación ─────────────────────────────────────────────────
const PTS_PREGUNTA       = 0.10;
const FRACCION_RESPUESTA = 0.70;  // 70%: respuesta correcta
const FRACCION_JUST      = 0.30;  // 30%: justificación válida
const CONCURRENCIA       = 10;    // llamadas paralelas a DeepSeek (evitar rate limit)

// ─── 1. Obtener exámenes finalizados sin calificar ────────────────────────────
console.log('Consultando exámenes finalizados sin calificación…');

const { data: examenes, error: errExamenes } = await supabase
  .from('examenes_asignados')
  .select('id_examen, email_estudiante, nivel, preguntas_asignadas, respuestas_estudiante')
  .eq('estado', 'finalizado')
  .is('calificacion_final', null);

if (errExamenes) {
  console.error('Error al consultar Supabase:', errExamenes.message);
  process.exit(1);
}

if (!examenes || examenes.length === 0) {
  console.log('✓ No hay exámenes pendientes de calificación.');
  process.exit(0);
}

console.log(`Encontrados ${examenes.length} exámenes para calificar.\n`);

// ─── 2. Calificar preguntas objetivas y recopilar justificaciones ─────────────
// puntosPorExamen: { id_examen → puntos acumulados }
// tareas:  array de { idExamen, prompt } para evaluar con DeepSeek
const puntosPorExamen = {};
const tareas = [];

for (const examen of examenes) {
  puntosPorExamen[examen.id_examen] = 0;
  const preguntas  = examen.preguntas_asignadas ?? [];
  const respuestas = examen.respuestas_estudiante ?? {};

  for (let i = 0; i < preguntas.length; i++) {
    const p    = preguntas[i];
    const r    = respuestas[String(i)];
    const tipo = p.Tipo_Pregunta;

    if (!r) continue; // sin respuesta → 0 pts

    // ── Opción Múltiple ────────────────────────────────────────────────────
    if (tipo === 'Opción Múltiple') {
      const rta = typeof r === 'object' ? r.respuesta : r;
      if (rta === p.Respuesta_Correcta) {
        puntosPorExamen[examen.id_examen] += PTS_PREGUNTA;
      }

    // ── Unir con Líneas ────────────────────────────────────────────────────
    } else if (tipo === 'Unir con Líneas') {
      const correctas  = parsearCorreccionUnion(p.Respuesta_Correcta);
      const totalPares = Math.max(Object.keys(correctas).length, 1);
      let aciertos = 0;
      if (typeof r === 'object' && !('respuesta' in r)) {
        for (const [k, v] of Object.entries(r)) {
          if (correctas[k] === v) aciertos++;
        }
      }
      puntosPorExamen[examen.id_examen] += (aciertos / totalPares) * PTS_PREGUNTA;

    // ── Verdadero o Falso / Casos de Uso ──────────────────────────────────
    } else if (tipo === 'Verdadero o Falso' || tipo === 'Casos de Uso') {
      const rta           = typeof r === 'object' ? r.respuesta      : r;
      const justificacion = typeof r === 'object' ? (r.justificacion ?? '') : '';

      if (rta !== p.Respuesta_Correcta) continue; // respuesta incorrecta → 0 pts

      // Respuesta correcta → puntaje base (70%)
      puntosPorExamen[examen.id_examen] += PTS_PREGUNTA * FRACCION_RESPUESTA;

      // Sin justificación → no se acredita el 30% restante
      if (!justificacion.trim()) continue;

      tareas.push({
        idExamen: examen.id_examen,
        prompt:   construirPrompt(p, rta, justificacion)
      });
    }
  }
}

// ─── 3. Evaluar justificaciones con DeepSeek (llamadas paralelas) ─────────────
if (tareas.length > 0) {
  console.log(`Evaluando ${tareas.length} justificaciones con DeepSeek-V3…\n`);
  let errores = 0;

  for (let i = 0; i < tareas.length; i += CONCURRENCIA) {
    const grupo = tareas.slice(i, i + CONCURRENCIA);

    const resultados = await Promise.allSettled(
      grupo.map(t => evaluarJustificacion(t.prompt))
    );

    for (let j = 0; j < grupo.length; j++) {
      const res = resultados[j];
      if (res.status === 'fulfilled' && res.value === true) {
        puntosPorExamen[grupo[j].idExamen] += PTS_PREGUNTA * FRACCION_JUST;
      } else if (res.status === 'rejected') {
        errores++;
      }
    }

    const hecho = Math.min(i + CONCURRENCIA, tareas.length);
    process.stdout.write(`\r  Progreso: ${hecho}/${tareas.length}  (${errores} errores)`);
  }

  console.log('\n');
} else {
  console.log('No hay justificaciones que evaluar.\n');
}

// ─── 4. Calcular notas finales y guardar en Supabase ─────────────────────────
console.log('Actualizando calificaciones en Supabase…\n');
let exitosos = 0, fallidos = 0;

for (const examen of examenes) {
  const calificacion = Math.min(
    Math.round((puntosPorExamen[examen.id_examen] ?? 0) * 100) / 100,
    10
  );

  const { error } = await supabase
    .from('examenes_asignados')
    .update({ calificacion_final: calificacion })
    .eq('id_examen', examen.id_examen);

  if (error) {
    console.error(`  ✗ ${examen.email_estudiante}: ${error.message}`);
    fallidos++;
  } else {
    const nivel = examen.nivel === 4 ? '4to' : '8vo';
    console.log(`  ✓ ${examen.email_estudiante} (${nivel} nivel): ${calificacion.toFixed(2)}/10`);
    exitosos++;
  }
}

console.log(`\n${'─'.repeat(50)}`);
console.log(`Calificación completada: ${exitosos} actualizados, ${fallidos} errores.`);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Envía una justificación a DeepSeek y devuelve true si es válida.
 * Solo envía texto académico anónimo — sin emails ni datos del estudiante.
 */
async function evaluarJustificacion(prompt) {
  const respuesta = await deepseek.chat.completions.create({
    model:       'deepseek-chat',
    max_tokens:  64,
    temperature: 0,  // respuesta determinista
    messages:    [{ role: 'user', content: prompt }]
  });

  const texto = respuesta.choices[0]?.message?.content ?? '';
  const match = texto.match(/\{\s*"valida"\s*:\s*(true|false)\s*\}/);
  if (match) return JSON.parse(match[0]).valida;
  return false;
}

/**
 * Construye el prompt de evaluación.
 * NO incluye el email ni ningún dato identificador del estudiante.
 */
function construirPrompt(pregunta, respuestaCorrecta, justificacion) {
  return `Eres un evaluador académico. Determina si la justificación demuestra comprensión correcta del tema.

ENUNCIADO: ${pregunta.Enunciado}
RESPUESTA CORRECTA: ${respuestaCorrecta}
JUSTIFICACIÓN MODELO: ${pregunta.Justificacion ?? '(no disponible)'}
JUSTIFICACIÓN DEL ESTUDIANTE: ${justificacion}

Responde ÚNICAMENTE con JSON válido, sin texto adicional:
{"valida": true}  → si demuestra comprensión del tema, aunque no sea perfecta
{"valida": false} → si es incorrecta, sin sentido o no guarda relación con la pregunta`;
}

/**
 * Parsea el campo Respuesta_Correcta de Unir con Líneas.
 * Acepta: objeto, JSON string, o "Concepto1:Def2;Concepto2:Def1;…"
 */
function parsearCorreccionUnion(rc) {
  if (!rc) return {};
  if (typeof rc === 'object') return rc;
  if (rc.startsWith('{')) { try { return JSON.parse(rc); } catch {} }
  const res = {};
  for (const par of rc.split(';')) {
    const [k, v] = par.split(':').map(s => s.trim());
    if (k && v) res[k] = v;
  }
  return res;
}
