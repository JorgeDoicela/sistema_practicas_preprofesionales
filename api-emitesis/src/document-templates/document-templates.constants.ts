/** Si no hay plantillas activas en BD, se usa esta lista (misma semántica que antes). */
export const FALLBACK_DOCUMENT_TEMPLATES: Array<{
  name: string;
  sortOrder: number;
  isRequired: boolean;
  isCertificateSlot: boolean;
  blankFileKey: string | null;
}> = [
  {
    name: 'Solicitud de prácticas',
    sortOrder: 10,
    isRequired: true,
    isCertificateSlot: false,
    blankFileKey: 'solicitud_practicas.docx',
  },
  {
    name: 'Plan de rotación',
    sortOrder: 20,
    isRequired: true,
    isCertificateSlot: false,
    blankFileKey: 'plan_rotacion.docx',
  },
  {
    name: 'Informe de actividades',
    sortOrder: 30,
    isRequired: true,
    isCertificateSlot: false,
    blankFileKey: 'informe_actividades.docx',
  },
  {
    name: 'Registro de asistencia',
    sortOrder: 40,
    isRequired: true,
    isCertificateSlot: false,
    blankFileKey: 'registro_asistencia.docx',
  },
  {
    name: 'Evaluación del tutor académico',
    sortOrder: 50,
    isRequired: true,
    isCertificateSlot: false,
    blankFileKey: 'evaluacion_tutor.docx',
  },
  {
    name: 'Evaluación del representante de la empresa',
    sortOrder: 60,
    isRequired: true,
    isCertificateSlot: false,
    blankFileKey: 'evaluacion_representante.docx',
  },
  {
    name: 'Informe final de prácticas',
    sortOrder: 70,
    isRequired: true,
    isCertificateSlot: false,
    blankFileKey: 'informe_final.docx',
  },
  {
    name: 'Certificado de culminación',
    sortOrder: 80,
    isRequired: false,
    isCertificateSlot: true,
    blankFileKey: 'certificado_culminacion.docx',
  },
];
