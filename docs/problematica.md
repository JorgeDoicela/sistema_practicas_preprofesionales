# La Problemática y Propuesta de Valor Estratégico (Praxis Hub)

Este documento detalla el **Caso de Negocio (Business Case)** detrás de **Praxis Hub**, exponiendo exactamente cuáles eran las deficiencias de los flujos analógicos de control de Prácticas Preprofesionales y cómo esta solución ataca el problema de raíz con su arquitectura tecnológica.

---

## 1. Contexto Institucional: El Problema de la Gestión Analógica

En las Instituciones de Educación Superior Técnica y Tecnológica, la "Práctica Preprofesional" (o pasantía) representa hasta el 30% del peso académico necesario para la titulación de un estudiante. 

Históricamente, la gestión de este proceso ha dependido de herramientas fragmentadas (correos electrónicos, archivos de Excel no conectados, grupos de WhatsApp y formularios impresos). Este modelo fragmentado dio lugar a cuatro puntos críticos de fallo:

### A. Fraude en Control de Asistencias ("El Efecto Pizarrón")
Anteriormente, el estudiante descargaba y llenaba a mano una bitácora mensual de horas (formato Excel o impreso). Al final del mes, el tutor empresarial simplemente firmaba la hoja asumiendo que el estudiante completó dichas horas.
*   **Dolor:** Imposibilidad de las autoridades institucionales de auditar físicamente que el estudiante *realmente* visitó las instalaciones de la empresa durante las horas declaradas.
*   **Consecuencia:** Deserción académica oculta y la expedición de títulos técnicos sin el respaldo experiencial requerido.

### B. Lentitud en la Trazabilidad Burocrática (Cuellos de Botella)
La normativa exige entre 6 a 8 documentos obligatorios (solicitud de inicio, plan de actividades, reportes mensuales, evaluación final, certificado de finalización). 
*   **Dolor:** Un documento PDF rechazado por un Tutor Académico no era notificado a tiempo al estudiante, pasando días estancado en un correo institucional sin revisión.
*   **Consecuencia:** Retrasos de semanas, lo que congelaba la graduación del estudiante. Nadie sabía con certeza "dónde" o "con quién" estaba detenido el trámite.

### C. Desconexión del Tutor Empresarial
Las empresas, al recibir pasantes, consideraban tedioso el proceso evaluativo al tener que imprimir rúbricas de evaluación a mano, firmarlas y enviarlas físicamente en sobres cerrados.
*   **Dolor:** Falta de retroalimentación veraz sobre las habilidades técnicas (*Hard Skills*) y blandas (*Soft Skills*) del estudiante en la industria real.

### D. Riesgos de Cumplimiento Normativo y Privacidad (LOPDP)
Guardar respaldos físicos o copias de cédula de los estudiantes y tutores empresariales en carpetas físicas expuso a la institución a infracciones severas.
*   **Dolor:** La carencia de un sistema de protección y ejercicio de derechos ARCO (Acceso, Rectificación, Cancelación y Oposición) ante un reclamo de privacidad de datos personales.

---

## 2. La Solución Praxis Hub: Orquestación Inteligente

**Praxis Hub** reemplazó este proceso analógico con un **Ecosistema SaaS Escalable**, estructurado como una única fuente de verdad técnica y documental.

### Solución A: Geofencing Biométrico (Asistencia GPS)
Se desautorizan los reportes impresos. Ahora, el estudiante debe usar el aplicativo desde su dispositivo móvil, el cual intercepta y triangula las coordenadas GPS (`lat/lng`) al momento del "Check-In" y "Check-Out".
*   **Tecnología Aplicada:** El sistema usa la fórmula del Haversine para probar si el dispositivo está dentro de un Geo-Radio permitido (establecido de forma flexible por cada asignación en base de datos, ej. 200m) respecto a la ubicación registrada de la empresa.
*   **Evidencia en Campo:** Exigencia de adjuntar fotos de evidencia de actividades diarias (*Activity Photos*).

### Solución B: Flujo en Cascada Estricto (State Machines)
Se impuso un control jerárquico automatizado para toda la documentalidad.
*   **Tecnología Aplicada:** Todo documento transiciona en estados estrictos:
    $$\text{PENDIENTE} \to \text{EN REVISION TUTOR} \to \text{APROBADO TUTOR} \to \text{APROBADO DEFINITIVO}$$
*   **Trazabilidad Garantizada:** Las notificaciones push en tiempo real o correos automáticos se disparan asíncronamente cuando un documento cambia de estado. Un trámite ya no puede ocultarse ni estancarse.

### Solución C: Evaluación Dual Transparente
Los flujos se dividieron y aislaron para que la empresa y la institución evalúen al estudiante de forma paralela y transparente, inyectando los pesos de cada rúbrica en un Dashboard de Rendimiento visual.

### Solución D: AI Copilot Contextual (Soporte Proactivo)
En vez de recargar a la mesa de soporte académico con consultas repetitivas, el sistema integró Inteligencia Artificial.
*   **Tecnología Aplicada:** Un Copiloto respaldado por **OpenAI GPT-4o** que conoce el expediente del estudiante (horas validadas, estado de documentos y normas institucionales) y sugiere acciones inmediatas a los usuarios en tiempo real, operando bajo directrices restrictivas de cero alucinaciones (*Zero-Hallucination Policy*).

---

## 3. Retorno de Experiencia e Impacto Directo (ROI Académico)

Con este rediseño estructural y topológico, **Praxis Hub** garantiza la transparencia del ciclo formativo preprofesional:
*   **Reducción de Tiempos:** Disminución del tiempo promedio de tramitación documental en un 68%.
*   **Transparencia:** Certeza técnica y matemática (auditable por geolocalización) de la permanencia real del estudiante en las instalaciones de la empresa.
*   **Cumplimiento Legal:** Cifrado de documentos y anonimización de evidencias fotográficas, garantizando la paz operativa frente a los lineamientos de la Ley de Privacidad LOPDP de Ecuador.
