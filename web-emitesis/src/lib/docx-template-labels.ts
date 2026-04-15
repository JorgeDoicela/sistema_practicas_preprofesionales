/** Nombres amigables para los .docx de formato en blanco (plantillas institucionales). */
const DOCX_LABELS: Record<string, string> = {
  "solicitud_practicas.docx": "Solicitud de prácticas",
  "plan_rotacion.docx": "Plan de rotación",
  "informe_actividades.docx": "Informe de actividades",
  "registro_asistencia.docx": "Registro de asistencia",
  "evaluacion_tutor.docx": "Evaluación del tutor académico",
  "evaluacion_representante.docx": "Evaluación del representante de la empresa",
  "informe_final.docx": "Informe final de prácticas",
  "certificado_culminacion.docx": "Certificado de culminación (plantilla base, si aplica)",
};

export function labelForDocxKey(key: string): string {
  const k = key.trim().toLowerCase();
  return DOCX_LABELS[k] || key.replace(/_/g, " ");
}
