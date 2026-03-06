# Emitesis: Sistema de Prácticas Preprofesionales

Emitesis no es solo un gestor de archivos; es una plataforma diseñada para digitalizar y automatizar el ciclo de vida completo de las prácticas preprofesionales en el instituto. El objetivo central es eliminarel manejo manual de documentos y asegurar que el proceso cumpla con los estándares de control y validación requeridos institucionalmente.

## Los 4 Actores Principales

El sistema opera bajo un modelo de gestión por roles, asegurando que cada usuario tenga acceso solo a lo que le compete:

*   **Administrador:** El "arquitecto" del sistema; gestiona el funcionamiento técnico, usuarios y configuraciones globales.
*   **Coordinador de Prácticas:** El "director de orquesta"; registra convenios con empresas, asigna estudiantes a sus plazas y tutores, y da la validación final a todo el proceso.
*   **Tutor Académico:** El "supervisor"; configura las fechas de entrega y realiza la primera revisión de la documentación del estudiante.
*   **Estudiante:** El "protagonista"; registra su asistencia diaria mediante GPS y gestiona sus 8 documentos obligatorios.

## Los 8 Módulos Funcionales

El sistema se divide en módulos que cubren desde el primer contacto con la empresa hasta la graduación del proceso:

| Módulo | Descripción Clave | Requerimiento |
| :--- | :--- | :--- |
| **Autenticación** | Acceso seguro mediante credenciales institucionales y bloqueo por intentos fallidos. | RF-AUT-001 |
| **Convenios** | Registro de acuerdos con empresas y notificación automática vía correo para la firma del documento. | RF-CON-001 |
| **Gestión Usuarios** | Control total sobre quién entra al sistema y qué rol desempeña. | RF-USR-001 |
| **Asignación** | Vinculación del estudiante con una empresa activa, un tutor y la definición de horas a cumplir. | RF-ASG-001 |
| **Gestión Documental** | El corazón del sistema: flujo de subida, revisión y aprobación de los 8 documentos obligatorios. | RF-DOC-001 |
| **Asistencia** | Registro diario con verificación de ubicación geográfica (Geofencing). | RF-ASI-001 |
| **Certificación** | Generación automática del certificado en PDF una vez cumplidas las horas y documentos. | RF-CERT-001 |
| **Notificaciones** | Alertas automáticas por correo ante aprobaciones, rechazos o plazos por vencer. | RF-NOT-001 |

## El Flujo de los 8 Documentos

Uno de los puntos más innovadores de Emitesis es su flujo de validación en cascada para los documentos obligatorios:

1.  **Subida:** El estudiante descarga el formato, lo llena y lo sube en PDF.
2.  **Filtro 1 (Tutor):** El tutor aprueba o rechaza con comentarios. Si rechaza, el estudiante corrige y reintenta.
3.  **Filtro 2 (Coordinador):** Una vez aprobado por el tutor, el coordinador da el visto bueno definitivo.
4.  **Bloqueo de Integridad:** Tras la aprobación final, el documento se bloquea; no puede ser borrado ni modificado, garantizando la trazabilidad.

## Control de Asistencia Inteligente

Para evitar registros falsos, el sistema no solo guarda la hora, sino que valida la ubicación del estudiante. Se utiliza la Fórmula de Haversine para calcular que el estudiante esté realmente en la empresa:

$$d = 2r \arcsin\left(\sqrt{\sin^2\left(\frac{lat_2-lat_1}{2}\right) + \cos(lat_1) \cos(lat_2) \sin^2\left(\frac{lon_2-lon_1}{2}\right)}\right)$$

El sistema permite el registro solo si la distancia $d$ es menor a 200 metros del punto de práctica definido.

## Calidad de Software (ISO/IEC 25010)

El proyecto se rige por atributos de calidad estrictos, aspirando a un nivel profesional:

*   **Seguridad:** Contraseñas cifradas con BCrypt y sesiones con tiempo de expiración.
*   **Rendimiento:** Respuestas del sistema en menos de 2 segundos.
*   **Disponibilidad:** Operatividad del 99.9%.
*   **Trazabilidad:** Logs de auditoría para cada acción crítica realizada por cualquier usuario.

En resumen, el proyecto busca transformar un proceso burocrático pesado en una experiencia fluida, segura y auditable.

---

## Instalación y Despliegue (Clonación)

Sigue estos pasos para clonar y ejecutar el proyecto en tu entorno local.

### 1. Clonar el Repositorio

Abre tu terminal y ejecuta el siguiente comando para clonar el repositorio completo (que incluye tanto el backend como el frontend):

```bash
git clone https://github.com/TU_USUARIO/TU_REPOSITORIO.git
cd sistema_practicas_preprofesionales
```

*(Nota: Reemplaza la URL con la de tu repositorio de GitHub)*

### 2. Estructura del Proyecto

El proyecto está dividido en dos partes principales:
*   `api-emitesis/`: API principal o Backend.
*   `web-emitesis/`: Interfaz de usuario o Frontend.

### 3. Levantar el Backend (`api-emitesis`)

```bash
cd api-emitesis
# Instalar dependencias
npm install
# Configurar las variables de entorno (Crear archivo .env basado en un .env.example si existe)
# Levantar el servidor en modo desarrollo
npm run start:dev
```

### 4. Levantar el Frontend (`web-emitesis`)

Abre una nueva terminal en la raíz del proyecto y navega al frontend:

```bash
cd web-emitesis
# Instalar dependencias
npm install
# Configurar variables de entorno necesarias (.env)
# Iniciar el servidor de desarrollo
npm run dev # o el comando que aplique según el framework (ej. npm start)
```

¡Con esto, ambos entornos deberían estar corriendo localmente!
