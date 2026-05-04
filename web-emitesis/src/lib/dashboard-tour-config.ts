import type { Role } from "@/constants/roles";
import { ROLE_LABELS } from "@/constants/roles";

export type TourStepDef = {
  id: string;
  /** Selector CSS; debe existir un `data-tour` en el DOM */
  selector: string;
  title: string;
  getDescription: (role: Role) => string;
};

function roleLabel(role: Role): string {
  return ROLE_LABELS[role] ?? "Usuario";
}

/** 
 * Pasos dinámicos por página. 
 * El sistema busca coincidencias en la URL para ofrecer ayuda específica.
 */
export function getDashboardTourSteps(role: Role, pathname: string): TourStepDef[] {
  // 1. Ayuda específica para el TABLERO PRINCIPAL
  if (pathname === "/dashboard" || pathname.endsWith("/dashboard")) {
    return [
      {
        id: "dash-stats",
        selector: '[data-tour="dashboard-stats"]',
        title: "Métricas en vivo",
        getDescription: (rl) => `Aquí ${rl === 'ADMIN' ? 'monitorea la salud institucional' : 've su progreso personal'}. Los indicadores muestran horas cumplidas, convenios activos y estados de trámites en tiempo real.`,
      },
      {
        id: "dash-announcements",
        selector: '[data-tour="dashboard-announcements"]',
        title: "Comunicados Oficiales",
        getDescription: () => "Manténgase al día con los reglamentos y avisos del ISTPET. Use las flechas para navegar entre los anuncios vigentes.",
      },
      {
        id: "dash-analytics",
        selector: '[data-tour="dashboard-analytics"]',
        title: "Analíticas de Gestión",
        getDescription: () => "Gráficos detallados sobre la distribución de prácticas y cumplimiento académico. Pase el cursor sobre las barras para ver datos exactos.",
      }
    ];
  }

  // 2. Ayuda específica para GESTIÓN DE USUARIOS (Admin/Coordinador)
  if (pathname.includes("/usuarios")) {
    return [
      {
        id: "users-search",
        selector: '[data-tour="users-search"]',
        title: "Búsqueda Inteligente",
        getDescription: () => "Encuentre cualquier usuario por nombre, correo o cédula. Los resultados se actualizan mientras escribe.",
      },
      {
        id: "users-table",
        selector: '[data-tour="users-table"]',
        title: "Listado de Cuentas",
        getDescription: () => "Aquí puede ver el rol, estado de activación y fecha de registro. Use el botón de 'Editar' en cada fila para modificar permisos.",
      },
      {
        id: "users-new",
        selector: '[data-tour="users-new"]',
        title: "Registro de Personal",
        getDescription: () => "Añada nuevos estudiantes, tutores o personal administrativo manualmente desde este botón.",
      }
    ];
  }

  // 3. Ayuda específica para ASISTENCIA (Estudiantes/Tutores)
  if (pathname.includes("/asistencia")) {
    return [
      {
        id: "att-radar",
        selector: '[data-tour="attendance-radar"]',
        title: "Geo-Radar GPS",
        getDescription: () => "El sistema valida su ubicación mediante el algoritmo Haversine. Debe estar dentro del rango permitido para marcar entrada o salida.",
      },
      {
        id: "att-actions",
        selector: '[data-tour="attendance-actions"]',
        title: "Registro Biométrico",
        getDescription: () => "Use estos botones para registrar su jornada. Recuerde que el sistema solicita una foto de actividad y verificación WebAuthn (huella/FaceID).",
      }
    ];
  }

  // 4. Ayuda específica para CONFIGURACIÓN DE PERFIL (Usuario)
  if (pathname.includes("/dashboard/configuracion")) {
    return [
      {
        id: "cfg-security",
        selector: '[data-tour="settings-security"]',
        title: "Seguridad de Cuenta",
        getDescription: () => "Configure su Autenticación de Dos Factores (2FA) para proteger su acceso. Es obligatorio para coordinadores y administradores.",
      },
      {
        id: "cfg-privacy",
        selector: '[data-tour="settings-sessions"]',
        title: "Privacidad LOPDP",
        getDescription: () => "Consulte cómo el ISTPET protege sus datos personales y ejerza sus derechos ARCO de forma digital.",
      }
    ];
  }

  // 4.1. Ayuda específica para CONFIGURACIÓN DEL SISTEMA (Admin)
  if (pathname.includes("/admin/configuracion")) {
    return [
      {
        id: "admin-cfg-gps",
        selector: '[data-tour="admin-settings-gps"]',
        title: "Parámetros de Asistencia",
        getDescription: () => "Configure la precisión del GPS y el radio de tolerancia para el registro de asistencias. Estos valores afectan a todos los estudiantes.",
      },
      {
        id: "admin-cfg-auth",
        selector: '[data-tour="admin-settings-auth"]',
        title: "Seguridad Global",
        getDescription: () => "Administre políticas de seguridad del sistema, como expiración de sesiones y requisitos de contraseñas institucionales.",
      }
    ];
  }

  // 5. Ayuda específica para DOCUMENTOS
  if (pathname.includes("/documentos")) {
    return [
      {
        id: "docs-list",
        selector: '[data-tour="documents-list"]',
        title: "Expediente Digital",
        getDescription: () => "Lista de documentos obligatorios y opcionales. El color indica el estado: verde (aprobado), azul (en revisión) o rojo (rechazado).",
      },
      {
        id: "docs-upload",
        selector: '[data-tour="documents-upload"]',
        title: "Carga y Validación AI",
        getDescription: () => "Descargue plantillas oficiales y suba sus PDFs. El sistema utiliza Visión Artificial para pre-verificar el contenido antes del envío.",
      }
    ];
  }

  // 6. Ayuda específica para CONVENIOS (Coordinador)
  if (pathname.includes("/coordinador/convenios/list")) {
    return [
      {
        id: "conv-list",
        selector: '[data-tour="agreements-table"]',
        title: "Convenios Vigentes",
        getDescription: () => "Aquí puede visualizar todos los convenios activos y caducados. Use los filtros para buscar por RUC o Nombre de la Empresa.",
      }
    ];
  }

  if (pathname.includes("/coordinador/convenios") && !pathname.includes("/list")) {
    return [
      {
        id: "conv-entity",
        selector: '[data-tour="agreement-form-entity"]',
        title: "Datos de la Empresa",
        getDescription: () => "Ingrese la información legal de la entidad receptora. El RUC será validado automáticamente según el estándar de Ecuador.",
      },
      {
        id: "conv-legal",
        selector: '[data-tour="agreement-form-legal"]',
        title: "Formalización Legal",
        getDescription: () => "Defina el tipo de convenio, vigencia y cargue el documento PDF firmado. Recuerde que el archivo no debe superar los 10MB.",
      },
      {
        id: "conv-submit",
        selector: '[data-tour="agreement-form-submit"]',
        title: "Registrar Convenio",
        getDescription: () => "Confirme el registro para habilitar la asignación de estudiantes a esta empresa. Podrá editar estos datos más adelante si es necesario.",
      }
    ];
  }

  // 7. Ayuda específica para REPORTES (Coordinador)
  if (pathname.includes("/reportes")) {
    return [
      {
        id: "rep-export",
        selector: '[data-tour="reportes-export-actions"]',
        title: "Exportación Rápida",
        getDescription: () => "Genere versiones inmediatas en Excel o PDF de las estadísticas globales para informes rápidos o reuniones de coordinación.",
      },
      {
        id: "rep-stats",
        selector: '[data-tour="reportes-stats-grid"]',
        title: "Indicadores de Gestión",
        getDescription: () => "Monitoree en tiempo real las asignaciones activas, revisiones pendientes y el total de horas acumuladas por los estudiantes.",
      },
      {
        id: "rep-efficiency",
        selector: '[data-tour="reportes-efficiency-metrics"]',
        title: "Métricas de Eficiencia",
        getDescription: () => "Visualice el progreso porcentual y la efectividad del período. Estos datos son cruciales para la toma de decisiones institucionales.",
      },
      {
        id: "rep-master",
        selector: '[data-tour="reportes-master"]',
        title: "Reporte Maestro",
        getDescription: () => "Exporte toda la base de datos con trazabilidad completa. Este documento es el requerido para auditorías del CES y procesos de acreditación.",
      }
    ];
  }

  // 8. Ayuda específica para EVALUACIONES
  if (pathname.includes("/evaluaciones")) {
    return [
      {
        id: "eval-search",
        selector: '[data-tour="evaluations-search"]',
        title: "Buscador de Desempeño",
        getDescription: () => "Filtre por nombre de estudiante o empresa para revisar calificaciones específicas. Los resultados se actualizan al instante.",
      },
      {
        id: "eval-kpis",
        selector: '[data-tour="evaluations-kpis"]',
        title: "Promedios Globales",
        getDescription: () => "Vea el porcentaje de estudiantes evaluados y la nota promedio del período actual. Esto le permite medir la satisfacción de las empresas en tiempo real.",
      },
      {
        id: "eval-list",
        selector: '[data-tour="evaluations-list"]',
        title: "Calificaciones y Feedback",
        getDescription: () => "Consulte el desempeño de cada estudiante. Haga clic en una fila para ver el desglose de criterios (proactividad, técnica, etc.) y las observaciones detalladas del tutor.",
      }
    ];
  }

  // 9. Ayuda específica para PLANTILLAS (Coordinador/Admin)
  if (pathname.includes("/plantillas-documentos")) {
    return [
      {
        id: "tpl-new",
        selector: '[data-tour="templates-new"]',
        title: "Crear Nueva Plantilla",
        getDescription: () => "Añada un nuevo requisito al expediente digital. Puede definir si es para toda la institución o específico para una carrera.",
      },
      {
        id: "tpl-list",
        selector: '[data-tour="templates-list"]',
        title: "Modelos Oficiales",
        getDescription: () => "Lista de documentos configurados. Puede activar/desactivar plantillas, cambiar el orden secuencial o subir nuevos formatos .docx.",
      },
      {
        id: "tpl-form",
        selector: '[data-tour="templates-form"]',
        title: "Panel de Configuración",
        getDescription: () => "Desde aquí controla los metadatos: si el documento es obligatorio, su posición en el flujo y si actúa como el slot final para el certificado.",
      }
    ];
  }

  // 10. Ayuda para LOGS (Admin)
  if (pathname.includes("/logs")) {
    return [
      {
        id: "logs-live",
        selector: '[data-tour="logs-live"]',
        title: "Terminal en Vivo",
        getDescription: () => "Monitorización en tiempo real vía WebSockets. Vea cada petición HTTP, errores de servidor y accesos de seguridad mientras ocurren.",
      },
      {
        id: "logs-history",
        selector: '[data-tour="logs-history"]',
        title: "Auditoría Histórica",
        getDescription: () => "Registro persistente de todas las acciones. Filtre para investigar eventos pasados, cambios de datos o IPs sospechosas.",
      }
    ];
  }

  // 11. Ayuda para PRIVACIDAD / LOPDP (Admin)
  if (pathname.includes("/privacidad")) {
    return [
      {
        id: "arco-list",
        selector: '[data-tour="arco-list"]',
        title: "Solicitudes ARCO",
        getDescription: () => "Gestione los derechos de Acceso, Rectificación, Cancelación y Oposición de los usuarios según la ley LOPDP de Ecuador.",
      }
    ];
  }

  // 12. Ayuda para SALUD (Admin)
  if (pathname.includes("/salud")) {
    return [
      {
        id: "health-latency",
        selector: '[data-tour="health-latency"]',
        title: "Latencia del Servidor",
        getDescription: () => "Monitorea los tiempos de respuesta promedio. Un valor bajo indica una infraestructura estable y rápida.",
      },
      {
        id: "health-actions",
        selector: '[data-tour="health-actions"]',
        title: "Tareas de Mantenimiento",
        getDescription: () => "Ejecute limpiezas de archivos huérfanos o respalde la base de datos para prevenir pérdida de información crítica.",
      }
    ];
  }

  // 13. Ayuda para CHAT-CONFIG (Admin)
  if (pathname.includes("/chat-config")) {
    return [
      {
        id: "chat-permissions",
        selector: '[data-tour="chat-permissions"]',
        title: "Matriz de Comunicación",
        getDescription: () => "Defina qué roles pueden hablar entre sí. Por ejemplo, habilite Estudiante ↔ Tutor pero mantenga bloqueados otros canales innecesarios.",
      },
      {
        id: "chat-retention",
        selector: '[data-tour="chat-retention"]',
        title: "Retención Legal",
        getDescription: () => "Establezca cuántos días se guardan los mensajes antes de ser purgados automáticamente, cumpliendo con normativas de privacidad.",
      }
    ];
  }

  // 14. Ayuda para ANUNCIOS (Admin)
  if (pathname.includes("/admin/anuncios")) {
    return [
      {
        id: "anuncios-list",
        selector: '[data-tour="anuncios-list"]',
        title: "Comunicación Masiva",
        getDescription: () => "Gestione las noticias que aparecen en el carrusel principal. Puede segmentar quién ve cada aviso y fijar fechas de caducidad.",
      }
    ];
  }

  // 15. Ayuda para CARRERAS (Admin)
  if (pathname.includes("/admin/carreras")) {
    return [
      {
        id: "carreras-list",
        selector: '[data-tour="carreras-list"]',
        title: "Estructura Académica",
        getDescription: () => "Configure las carreras vigentes en el instituto. Esto es vital para segmentar reportes y coordinadores por área.",
      }
    ];
  }

  // 16. Ayuda para ASIGNACIÓN (Coordinador)
  if (pathname.includes("/coordinador/asignacion")) {
    return [
      {
        id: "assign-actors",
        selector: '[data-tour="assignment-actors"]',
        title: "Vinculación de Actores",
        getDescription: () => "Seleccione el estudiante, el tutor académico y la empresa receptora. El sistema solo muestra usuarios activos y convenios vigentes.",
      },
      {
        id: "assign-details",
        selector: '[data-tour="assignment-details"]',
        title: "Detalles del Período",
        getDescription: () => "Defina las fechas de inicio/fin y el total de horas. También puede especificar la modalidad (presencial, híbrida, etc.).",
      },
      {
        id: "assign-geo",
        selector: '[data-tour="assignment-geofence"]',
        title: "Cerca Geográfica (Geofence)",
        getDescription: () => "Configure uno o varios puntos permitidos para el registro de asistencia. El estudiante solo podrá marcar entrada si está dentro de estos radios.",
      },
      {
        id: "assign-submit",
        selector: '[data-tour="assignment-submit"]',
        title: "Formalizar Asignación",
        getDescription: () => "Revise la advertencia legal y confirme. Se creará el expediente digital del estudiante y se habilitará su registro de horas.",
      }
    ];
  }

  // 17. Ayuda para GESTIÓN DE ESTUDIANTES (Coordinador)
  if (pathname.includes("/coordinador/estudiantes")) {
    return [
      {
        id: "stud-search",
        selector: '[data-tour="estudiantes-search"]',
        title: "Búsqueda de Expedientes",
        getDescription: () => "Localice rápidamente a cualquier estudiante por su nombre o empresa receptora para revisar su estado actual.",
      },
      {
        id: "stud-table",
        selector: '[data-tour="estudiantes-table"]',
        title: "Seguimiento Académico",
        getDescription: () => "Haga clic en la tarjeta de un estudiante para expandir su información. Podrá ver su progreso de horas, documentos y evaluaciones.",
      },
      {
        id: "stud-ai",
        selector: '[data-tour="student-ai-risk"]',
        title: "Análisis Predictivo IA",
        getDescription: () => "Use nuestra IA para detectar riesgos de deserción o problemas de salud. El sistema analiza patrones de asistencia y cumplimiento para emitir una alerta temprana.",
      },
      {
        id: "stud-elig",
        selector: '[data-tour="student-eligibility"]',
        title: "Dashboard de Elegibilidad",
        getDescription: () => "Verifique si el estudiante cumple con los dos requisitos legales: 240 horas de asistencia y 7 documentos aprobados.",
      },
      {
        id: "stud-cert",
        selector: '[data-tour="student-certification"]',
        title: "Certificación Digital",
        getDescription: () => "Una vez cumplidos los requisitos, podrá generar el Certificado de Culminación firmado digitalmente con un solo clic.",
      }
    ];
  }

  // 18. Ayuda para AUSENCIAS (Coordinador)
  if (pathname.includes("/coordinador/ausencias")) {
    return [
      {
        id: "abs-filters",
        selector: '[data-tour="ausencias-filters"]',
        title: "Filtros de Estado",
        getDescription: () => "Segmente las ausencias por estado: Pendientes, Aprobadas o Rechazadas para priorizar las revisiones urgentes.",
      },
      {
        id: "abs-list",
        selector: '[data-tour="ausencias-list"]',
        title: "Justificaciones de Faltas",
        getDescription: () => "Revise el motivo de cada falta. Puede aprobar o rechazar la ausencia; si se aprueba, la hora no afectará negativamente el progreso del estudiante.",
      }
    ];
  }

  // 19. Ayuda para DASHBOARD (Tutor Académico)
  if (pathname.includes("/tutor-academico/dashboard")) {
    return [
      {
        id: "tut-dash-kpis",
        selector: '[data-tour="tutor-dashboard-kpis"]',
        title: "Resumen de Gestión",
        getDescription: () => "Consulte rápidamente cuántos pasantes tiene activos, cuántos documentos están pendientes de su revisión y las visitas realizadas.",
      },
      {
        id: "tut-dash-chart",
        selector: '[data-tour="tutor-dashboard-chart"]',
        title: "Estado del Expediente",
        getDescription: () => "Este gráfico le muestra el avance global de los documentos de sus estudiantes. Le ayuda a identificar cuellos de botella en la entrega de requisitos.",
      },
      {
        id: "tut-dash-search",
        selector: '[data-tour="tutor-dashboard-search"]',
        title: "Localización de Pasantes",
        getDescription: () => "Busque estudiantes por nombre o empresa para acceder rápidamente a su expediente digital o registro de asistencia.",
      },
      {
        id: "tut-dash-list",
        selector: '[data-tour="tutor-dashboard-list"]',
        title: "Lista de Seguimiento",
        getDescription: () => "Cada tarjeta muestra alertas críticas: documentos por vencer, visitas requeridas o incumplimientos detectados por el sistema.",
      }
    ];
  }

  // 20. Ayuda para ASISTENCIA (Tutor Académico)
  if (pathname.includes("/tutor-academico/asistencia")) {
    return [
      {
        id: "tut-asist-search",
        selector: '[data-tour="tutor-asistencia-search"]',
        title: "Filtro de Asistencia",
        getDescription: () => "Encuentre pasantes específicos para revisar sus registros de entrada/salida y cumplimiento de horas.",
      },
      {
        id: "tut-asist-kpis",
        selector: '[data-tour="tutor-asistencia-kpis"]',
        title: "Métricas de Jornada",
        getDescription: () => "Vea el promedios de horas acumuladas y el progreso general de todos sus estudiantes asignados.",
      },
      {
        id: "tut-asist-list",
        selector: '[data-tour="tutor-asistencia-list"]',
        title: "Historial y Evidencia",
        getDescription: () => "Expanda cada fila para ver las fotos de biometría, las coordenadas GPS de cada marcación y el historial de los últimos 15 días.",
      },
      {
        id: "tut-asist-locs",
        selector: '[data-tour="tutor-asistencia-locations"]',
        title: "Control de Sedes",
        getDescription: () => "Configure las ubicaciones permitidas (Geofencing) para que el estudiante pueda marcar asistencia. Puede añadir múltiples sedes por empresa.",
      }
    ];
  }

  // 21. Ayuda para AUSENCIAS (Tutor Académico)
  if (pathname.includes("/tutor-academico/ausencias")) {
    return [
      {
        id: "tut-abs-list",
        selector: '[data-tour="tutor-ausencias-list"]',
        title: "Justificativos Pendientes",
        getDescription: () => "Revise las solicitudes de falta de sus estudiantes. Puede ver el documento adjunto y decidir si aprueba o rechaza la ausencia basándose en el motivo.",
      }
    ];
  }

  // 22. Ayuda para DASHBOARD (Empresa / Tutor Empresarial)
  if (pathname.includes("/empresa/dashboard")) {
    return [
      {
        id: "emp-dash-kpis",
        selector: '[data-tour="empresa-dashboard-kpis"]',
        title: "Métricas del Convenio",
        getDescription: () => "Consulte el total de horas acumuladas por sus pasantes y el estado de las evaluaciones pendientes para cerrar el ciclo académico.",
      },
      {
        id: "emp-dash-search",
        selector: '[data-tour="empresa-dashboard-search"]',
        title: "Buscador de Pasantes",
        getDescription: () => "Localice rápidamente a un estudiante específico para habilitar su evaluación o revisar su progreso individual.",
      },
      {
        id: "emp-dash-list",
        selector: '[data-tour="empresa-dashboard-list"]',
        title: "Gestión de Prácticas",
        getDescription: () => "Cada tarjeta muestra el avance en tiempo real. Puede ver quién ya terminó sus horas y quién requiere su atención inmediata.",
      },
      {
        id: "emp-dash-toggle",
        selector: '[data-tour="empresa-dashboard-test-toggle"]',
        title: "Habilitar Evaluación",
        getDescription: () => "Use este interruptor para permitir que el sistema genere el formulario de calificación. Solo actívelo cuando el estudiante esté cerca de cumplir sus horas.",
      }
    ];
  }

  // 23. Ayuda para ASISTENCIA (Empresa / Tutor Empresarial)
  if (pathname.includes("/empresa/asistencia")) {
    return [
      {
        id: "emp-asist-search",
        selector: '[data-tour="empresa-asistencia-search"]',
        title: "Control de Entradas",
        getDescription: () => "Filtre por nombre para auditar los registros de marcación de sus estudiantes asignados.",
      },
      {
        id: "emp-asist-kpis",
        selector: '[data-tour="empresa-asistencia-kpis"]',
        title: "Horas Acumuladas",
        getDescription: () => "Resumen global de la carga horaria cumplida dentro de su institución. Le ayuda a validar el cumplimiento del convenio.",
      },
      {
        id: "emp-asist-list",
        selector: '[data-tour="empresa-asistencia-list"]',
        title: "Evidencia de Jornada",
        getDescription: () => "Expanda cada fila para verificar la puntualidad y las fotografías tomadas por el sistema en cada punto de marcación.",
      }
    ];
  }

  // 24. Ayuda para EVALUACIÓN (Empresa / Tutor Empresarial)
  if (pathname.includes("/empresa/estudiantes/")) {
    return [
      {
        id: "emp-eval-file",
        selector: '[data-tour="empresa-eval-intern-file"]',
        title: "Ficha del Estudiante",
        getDescription: () => "Datos generales del pasante y resumen de su trayectoria en la empresa antes de proceder con la calificación final.",
      },
      {
        id: "emp-eval-evidence",
        selector: '[data-tour="empresa-eval-evidence"]',
        title: "Explorador de Evidencias",
        getDescription: () => "Revise las fotografías de actividades subidas por el estudiante durante sus jornadas de trabajo para respaldar su calificación.",
      },
      {
        id: "emp-eval-criteria",
        selector: '[data-tour="empresa-eval-criteria"]',
        title: "Criterios de Desempeño",
        getDescription: () => "Asigne de 1 a 5 estrellas en cada rubro: puntualidad, proactividad, aptitud técnica y actitud profesional.",
      },
      {
        id: "emp-eval-result",
        selector: '[data-tour="empresa-eval-result"]',
        title: "Calificación Final",
        getDescription: () => "El sistema calcula automáticamente el porcentaje de rendimiento. Recuerde añadir observaciones detalladas para el expediente académico.",
      }
    ];
  }

  // 25. Ayuda para DASHBOARD (Estudiante)
  if (pathname === "/dashboard") {
    return [
      {
        id: "stu-dash-stats",
        selector: '[data-tour="dashboard-stats"]',
        title: "Resumen de Prácticas",
        getDescription: () => "Visualice rápidamente su progreso de horas, el estado de sus documentos y sus marcaciones recientes.",
      },
      {
        id: "stu-dash-roadmap",
        selector: '[data-tour="dashboard-roadmap"]',
        title: "Su Ruta Académica",
        getDescription: () => "Consulte en qué etapa se encuentra: desde la asignación inicial hasta el cierre definitivo de su proceso.",
      },
      {
        id: "stu-dash-attendance",
        selector: '[data-tour="dashboard-attendance-card"]',
        title: "Marcación Rápida",
        getDescription: () => "Vea si tiene una marcación activa y acceda al radar GPS para registrar su entrada o salida en la empresa.",
      },
      {
        id: "stu-dash-hours",
        selector: '[data-tour="dashboard-hours-card"]',
        title: "Control de Horas",
        getDescription: () => "Monitoree cuántas horas le faltan para cumplir con el requisito de su carrera.",
      },
      {
        id: "stu-dash-copilot",
        selector: '[data-tour="dashboard-ai-copilot"]',
        title: "Nexo AI: Su Asistente",
        getDescription: () => "¿Tiene dudas sobre el proceso? Pregúntele a Nexo. Puede ayudarle con normativas, formatos y pasos a seguir.",
      }
    ];
  }

  // 26. Ayuda para ASISTENCIA (Estudiante)
  if (pathname === "/dashboard/asistencia") {
    return [
      {
        id: "stu-asist-radar",
        selector: '[data-tour="attendance-radar"]',
        title: "Radar de Proximidad",
        getDescription: () => "El sistema verifica que se encuentre dentro del perímetro permitido de la empresa para habilitar la marcación.",
      },
      {
        id: "stu-asist-actions",
        selector: '[data-tour="attendance-actions"]',
        title: "Registro Biométrico",
        getDescription: () => "Para marcar, deberá tomarse una foto de biometría facial y validar su identidad mediante huella o reconocimiento del dispositivo.",
      },
      {
        id: "stu-asist-activities",
        selector: '[data-tour="attendance-activities"]',
        title: "Evidencias de Trabajo",
        getDescription: () => "Suba fotografías de sus actividades diarias. Nexo AI puede ayudarle a generar descripciones automáticas para sus reportes.",
      },
      {
        id: "stu-asist-history",
        selector: '[data-tour="attendance-history"]',
        title: "Historial Detallado",
        getDescription: () => "Revise todos sus registros pasados, incluyendo horas exactas y ubicaciones de marcación.",
      }
    ];
  }

  // 27. Ayuda para AUSENCIAS (Estudiante)
  if (pathname === "/dashboard/ausencias") {
    return [
      {
        id: "stu-abs-header",
        selector: '[data-tour="absences-header"]',
        title: "Justificación de Faltas",
        getDescription: () => "Si no pudo asistir, registre aquí su ausencia adjuntando el certificado médico o documento correspondiente.",
      },
      {
        id: "stu-abs-list",
        selector: '[data-tour="absences-list"]',
        title: "Estado de Solicitudes",
        getDescription: () => "Verifique si su tutor ha aprobado o rechazado sus justificaciones y lea sus observaciones.",
      }
    ];
  }

  // 28. Ayuda para DOCUMENTOS (Estudiante)
  if (pathname === "/dashboard/documentos") {
    return [
      {
        id: "stu-doc-list",
        selector: '[data-tour="documents-list"]',
        title: "Gestión de Expediente",
        getDescription: () => "Descargue los formatos oficiales, llénelos y súbalos en formato PDF antes de la fecha límite.",
      },
      {
        id: "stu-doc-upload",
        selector: '[data-tour="documents-upload"]',
        title: "Pre-verificación por IA",
        getDescription: () => "Al subir un documento, Nexo AI lo escaneará para asegurar que los datos (como sus horas) coincidan con el sistema antes de enviarlo a revisión.",
      }
    ];
  }

  // 29. Ayuda para EVALUACIÓN (Estudiante)
  if (pathname === "/dashboard/mi-evaluacion") {
    return [
      {
        id: "stu-eval-grade",
        selector: '[data-tour="evaluation-grade"]',
        title: "Calificación Final",
        getDescription: () => "Aquí verá su nota ponderada sobre 10 puntos, calculada a partir de las evaluaciones de sus tutores.",
      },
      {
        id: "stu-eval-cards",
        selector: '[data-tour="evaluation-cards"]',
        title: "Desempeño Detallado",
        getDescription: () => "Revise su puntaje en criterios específicos como puntualidad, proactividad y aptitud técnica.",
      }
    ];
  }

  // Fallback: Ayuda general
  return [
    {
      id: "gen-sidebar",
      selector: '[data-tour="sidebar-main"]',
      title: "Menú Principal",
      getDescription: (rl) => `Como ${roleLabel(rl)}, use este panel para acceder a todas sus herramientas institucionales.`,
    }
  ];
}
