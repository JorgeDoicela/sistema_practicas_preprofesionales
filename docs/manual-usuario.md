# Manual de Usuario Final - Praxis Hub

Este manual guía a los diferentes actores del sistema a través de los flujos operativos y las funcionalidades de alto rendimiento implementadas en la plataforma **Praxis Hub**.

---

## 1. Roles y Responsabilidades en el Ecosistema

| Rol | Responsabilidad Principal | Acciones Clave en la Interfaz |
| :--- | :--- | :--- |
| **Estudiante** | Registrar asistencias y subir evidencias. | Marcaje GPS, subir fotos, chatear con AI Copilot, iterar documentos. |
| **Tutor Académico** | Supervisar el progreso y revisar la documentación. | Centro de monitoreo 360, registrar visitas en campo, aprobar/comentar PDFs. |
| **Empresa** | Validar la permanencia y evaluar competencias. | Panel de presencia en vivo, explorador de fotos, registrar rúbrica dual. |
| **Coordinador** | Configurar y dar cierre a los expedientes de práctica. | Crear asignaciones, activar convenios corporativos, dar visado final. |
| **Administrador** | Gestionar la salud de la plataforma y el cumplimiento legal. | Panel de logs, monitoreo de SMTP/IA, atender solicitudes ARCO (LOPDP). |

---

## 2. Guía Operativa por Módulo

### 2.1 Módulo del Estudiante (El Pasante Inteligente)
El estudiante accede a un panel simplificado tipo sandbox diseñado para gamificar y guiar su progreso.

*   **Roadmap Visual:** En la parte superior del Dashboard se muestra una línea de tiempo interactiva que se ilumina a medida que se completan los hitos (Asignación $\to$ Aprobación de Convenio $\to$ Registro de Bitácoras $\to$ Evaluaciones $\to$ Certificación).
*   **AI Copilot (Asistente Contextual):** Ubicado en la esquina inferior derecha. Los estudiantes pueden abrir el chat y realizar preguntas directas como:
    *   *¿Cuántas horas de práctica he completado hasta hoy?*
    *   *¿Por qué fue rechazado mi Formulario F02 y qué debo corregir?*
    *   *¿Cuáles son las directrices del ISTPET para la redacción de informes?*
*   **Registro de Asistencia (Geofencing y Evidencia):**
    1. Abre la sección "Marcaje" desde tu dispositivo móvil.
    2. Asegúrate de tener el GPS encendido y de estar en las oficinas de la empresa.
    3. Haz clic en "Check-In", el sistema comprobará tu ubicación. Si el dispositivo lo soporta, te solicitará firmar biométricamente (Passkey).
    4. Sube una fotografía nítida de tus actividades diarias (`ActivityPhoto`) y redacta una breve descripción del trabajo realizado.
    5. Al finalizar tu jornada, haz clic en "Check-Out".
*   **Gestión Documental (Iteración de Archivos):**
    *   Si tu tutor académico marca un documento como `RECHAZADO_TUTOR`, verás los comentarios específicos incrustados y un hilo de retroalimentación (`DocumentComment`).
    *   Sube una versión corregida en el mismo slot. El estado transicionará a `EN_REVISION_TUTOR`.

---

### 2.2 Módulo del Tutor Académico (Monitoreo 360)
El tutor académico supervisa activamente a su grupo asignado para evitar retrasos.

*   **HUB de Seguimiento:** Permite visualizar una lista en vivo con los estudiantes a su cargo, su porcentaje de horas completadas y el estado del semáforo de plazos.
*   **Revisión y Comentarios:** Al hacer clic en un documento cargado por el estudiante:
    *   El tutor puede visualizar el PDF directamente en el navegador (usando PDF.js).
    *   Permite escribir anotaciones en hilos de conversación directamente sobre el documento para guiar al estudiante en la corrección.
    *   Aprueba con un clic (transiciona a `APROBADO_TUTOR`).
*   **Registro de Visitas de Monitoreo:**
    *   El tutor debe documentar sus supervisiones (mínimo una presencial y una virtual).
    *   Haz clic en "Registrar Visita", completa la fecha, observaciones, recomendaciones y sube la foto de evidencia de la visita para cerrar el expediente.

---

### 2.3 Módulo de la Empresa (Control de Calidad Dual)
Permite a los representantes de las organizaciones integrarse en el proceso formativo sin fricciones.

*   **Presencia en Vivo:** Widget interactivo que muestra la lista de pasantes que han realizado "Check-In" en las sedes de la empresa durante el día actual.
*   **Explorador de Evidencias:** Galería visual que consolida las fotos que el estudiante ha subido en sus registros diarios. Permite verificar que las tareas reportadas correspondan con la realidad.
*   **Rúbrica de Evaluación Dual:** 
    *   Al concluir las horas de práctica, se habilita el formulario de evaluación.
    *   La empresa califica de 1 a 5 estrellas los criterios de puntualidad, trabajo en equipo, habilidades técnicas, proactividad y actitud.
*   **Certificado de Cumplimiento:** Una vez validado el expediente, la plataforma habilita un botón para descargar el certificado con membrete oficial del ISTPET firmado digitalmente.

---

### 2.4 Módulo de Administración y Coordinación (Gobernanza)
Destinado al control institucional global y el cumplimiento normativo.

*   **Salud del Sistema:** Panel técnico que muestra en tiempo real la conectividad de la base de datos, el consumo de tokens de OpenAI, almacenamiento y logs de errores HTTP.
*   **Asignaciones y Convenios:** Creación de asignaciones de prácticas (`Internships`) emparejando estudiante-tutor-empresa y cargando los archivos PDF de convenios institucionales.
*   **Gobernanza LOPDP:**
    *   Permite auditar accesos a datos sensibles de los estudiantes mediante `LopdpLog`.
    *   Atiende y procesa solicitudes de derechos ARCO (ej. cancelación de fotos o geolocalización) presentadas formalmente.

---

## 3. Preguntas Frecuentes (FAQ)

### ¿Qué hago si mi Check-In es rechazado por ubicación?
Asegúrate de estar físicamente en las oficinas de la empresa y tener la precisión del GPS configurada en "Alta precisión" en tu móvil. Si estás en la oficina y sigue fallando, contacta a tu tutor académico o coordinador para que verifiquen si las coordenadas registradas de la empresa en la base de datos son correctas o si requieren ampliar el radio de tolerancia GPS.

### ¿Un documento aprobado puede volver a editarse?
No. Bajo el **Protocolo de Inmutabilidad**, una vez que un documento alcanza el estado `APROBADO_DEFINITIVO` por el coordinador, queda bloqueado para ediciones o borrados por seguridad legal. Si requiere un cambio drástico, el coordinador debe realizar una anulación del estado de la práctica.

### ¿Por qué no puedo visualizar el botón para calificar al estudiante?
El botón de evaluación para el rol `EMPRESA` se habilita automáticamente únicamente cuando el estudiante ha completado y validado el 100% de las horas requeridas por su carrera en la bitácora de asistencias.

### ¿Quién evalúa por parte de la empresa?
La evaluación empresarial se registra con la cuenta institucional `EMPRESA` vinculada a la compañía (`companyId`). Esa cuenta representa oficialmente a la empresa en el proceso de prácticas.
