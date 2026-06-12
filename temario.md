# Guia de Estudio y Temario Master: Praxis Hub - Sistema de Gobernanza y Gestion de Practicas Preprofesionales

Este documento es la guía de estudio para la defensa de tesis del sistema Praxis Hub del Instituto Superior Tecnologico Mayor Pedro Traversari (ISTPET). Esta diseñado especificamente para comprender de inicio a fin la arquitectura, algoritmos, logica de negocio, politicas de seguridad, DevOps y despliegue del monorepositorio, capacitandose para responder con solvencia tecnica ante cualquier tribunal de grado.

---

## 1. Justificaciones Arquitectonicas y Stack Tecnologico

Para defender adecuadamente el sistema, es fundamental entender por que se eligieron estas tecnologias y que ventajas aportan sobre otras alternativas comunes en el mercado.

### 1.1 ¿Por que un Monorepositorio?
El sistema se organiza bajo el paradigma de Monorepositorio, gestionado a traves de Workspaces de npm.
*   **Coordinacion de Despliegue:** Permite versionar la API (backend) y la App Web (frontend) de forma conjunta. Cualquier cambio en los contratos de la API se ve reflejado de inmediato en el cliente.
*   **Gestion de Dependencias:** Facilita la instalacion y actualizacion de librerias de desarrollo compartidas (como TypeScript o Linters) en la raiz de un unico repositorio.
*   **Enlaces de Codigo:**
    *   [package.json (Raiz)](./package.json): Inicializa los dos workspaces (`api-emitesis` y `web-emitesis`) y orquesta el arranque simultaneo.

### 1.2 ¿Por que NestJS en el Backend?
En lugar de estructurar un servidor Express crudo y desorganizado, NestJS provee un entorno fuertemente tipado en TypeScript basado en el patron de diseño **Inyeccion de Dependencias (IoC)**.
*   **Modularidad y Mantenibilidad:** Cada entidad del sistema (usuarios, asistencia, documentos) tiene su propio modulo (`Module`), controlador (`Controller`) y servicio (`Service`). Esto aisla las responsabilidades.
*   **Seguridad y Validacion Out-of-the-box:** Permite interceptar peticiones entrantes mediante Guards de autenticacion y validarlas antes de tocar la logica del negocio usando DTOs y Pipes de validacion.
*   **Enlaces de Codigo:**
    *   [main.ts (Backend)](./api-emitesis/src/main.ts): Punto de entrada que levanta el servidor en el puerto 5000, e inyecta validaciones globales, interceptores de respuesta y filtros de excepciones.

### 1.3 ¿Por que Next.js (App Router) en el Frontend?
Next.js con React 19 proporciona una solucion hibrida de renderizado:
*   **Renderizado del lado del Servidor (SSR):** Optimiza la velocidad de carga inicial y la presentacion publica del sistema (landing page y login).
*   **Renderizado del lado del Cliente (CSR):** Mediante componentes interactivos de React, proporciona dashboards fluidos para cada rol sin necesidad de recargar la pagina completa en cada clic.
*   **Enlaces de Codigo:**
    *   [middleware.ts (Frontend)](./web-emitesis/src/middleware.ts): Guardian que intercepta los accesos web del usuario y valida los roles almacenados antes de permitir la visualizacion de las paginas del dashboard.

### 1.4 ¿Por que Prisma ORM y PostgreSQL?
*   **Base de datos Relacional (PostgreSQL):** Las practicas preprofesionales requieren consistencia ACID absoluta. Una falla en la relacion entre un estudiante, un tutor academico y una empresa invalidaria un expediente oficial.
*   **Prisma ORM:** Actua como un traductor tipado entre TypeScript y SQL nativo. Previene errores de sintaxis en tiempo de compilacion, maneja la creacion de esquemas mediante archivos de migracion reproducibles y mapea de forma natural las relaciones de la base de datos.
*   **Enlaces de Codigo:**
    *   [schema.prisma](./api-emitesis/prisma/schema.prisma): El unico archivo de definicion del modelo de datos e indices relacionales.

---

## 2. El Ciclo de Vida de la Practica (El Dia a Dia del Sistema)

Para comprender el flujo de informacion de Praxis Hub, a continuacion se detalla como fluye una practica preprofesional paso a paso a nivel de datos y logica:

```
[Paso 1: Convenio] --> [Paso 2: Asignacion] --> [Paso 3: Expediente] --> [Paso 4: Operaciones] --> [Paso 5: Calificacion] --> [Paso 6: Certificado]
```

### Paso 1: Registro del Convenio Institucional
*   **Accion:** El Coordinador registra una empresa en [Company](./api-emitesis/prisma/schema.prisma#L97) y sube el convenio firmado a [Agreement](./api-emitesis/prisma/schema.prisma#L112).
*   **Logica:** Se define la cantidad maxima de cupos (`maxInterns`) y la vigencia (`startDate` y `endDate`). Si el convenio expira, el sistema impide asociar nuevos estudiantes a dicha empresa.

### Paso 2: Creacion de la Asignacion (Internship)
*   **Accion:** El Coordinador crea el expediente de practica vinculando un estudiante, un tutor academico y una empresa en [Internship](./api-emitesis/prisma/schema.prisma#L125).
*   **Logica:** Se define la meta de horas (ej. 160 horas), la modalidad, las coordenadas de ubicacion GPS de la empresa (`lat`, `lng`) y las sedes autorizadas para geofencing (`allowedLocations`).

### Paso 3: Inicializacion del Expediente Documental
*   **Accion:** Al crearse la asignacion, el backend NestJS consulta las plantillas de documentos obligatorios configurados para la carrera del estudiante en [DocumentTemplate](./api-emitesis/prisma/schema.prisma#L191).
*   **Logica:** Genera automaticamente los registros vacios correspondientes en la tabla [Document](./api-emitesis/prisma/schema.prisma#L261) con el estado `PENDIENTE` y sus respectivas fechas limites (`dueDate`). El estudiante visualiza estas tareas pendientes como un roadmap.

### Paso 4: Operacion Diaria del Estudiante
Durante su estancia, el estudiante realiza tres tareas recurrentes:
1.  **Registro de Asistencia (Check-In / Check-Out):**
    *   Registra coordenadas GPS y adjunta una foto de evidencia que se guarda en la tabla [Attendance](./api-emitesis/prisma/schema.prisma#L310).
    *   La API de NestJS verifica mediante la formula Haversine que este dentro del perimetro autorizado.
    *   El estudiante redacta la bitacora de actividades del dia. Puede subir una foto complementaria y usar el Copiloto de IA para mejorar la redaccion profesional.
2.  **Carga de Documentos Obligatorios:**
    *   Sube el PDF firmado. El modulo de IA (GPT-4o) realiza un pre-analisis OCR del archivo para corroborar nombres, fechas y consistencia de horas antes de enviarlo al tutor.
    *   El documento pasa a `EN_REVISION_TUTOR`.
3.  **Justificacion de Ausencias:**
    *   Si no puede asistir, registra la fecha y motivo de la falta en [Absence](./api-emitesis/prisma/schema.prisma#L336), adjuntando un justificativo digital para revision y aprobacion del Tutor Academico.

### Paso 5: Evaluacion Dual (Rúbricas de Calificacion)
*   **Accion:** Al culminarse las horas planificadas, se disparan dos evaluaciones obligatorias en la tabla [Evaluation](./api-emitesis/prisma/schema.prisma#L210):
    *   **Evaluacion Empresarial:** Realizada por la empresa a traves del dashboard empresarial. Califica el desempeño practico y las habilidades blandas del pasante.
    *   **Evaluacion Academica:** Evaluada por el Tutor Academico, enfocada en la calidad del reporte y el cumplimiento institucional.
*   **Logica:** Ambas evaluaciones puntuan criterios de 1 a 5, los cuales son promediados y ponderados en el algoritmo del Health Score de la practica.

### Paso 6: Cierre de la Practica y Generacion de Certificado
*   **Accion:** El Tutor Academico aprueba todos los documentos (`APROBADO_TUTOR`) y el Coordinador da el visado definitivo (`APROBADO_DEFINITIVO`).
*   **Logica:** El servicio [certification.service.ts](./api-emitesis/src/certification/certification.service.ts) realiza la validacion de elegibilidad. Si se cumplen todos los requisitos, Puppeteer levanta un navegador headless en el servidor, renderiza una plantilla HTML con Handlebars, genera el bufer PDF del certificado, inyecta la firma digital criptografica y un codigo QR unico de verificacion, y cambia el estado del expediente a "Finalizado".

### Paso 7: Politicas LOPDP y Depuracion
*   **Accion:** Si el estudiante requiere ejercer sus derechos de privacidad:
    *   Solicita un reporte en [DataRequest](./api-emitesis/prisma/schema.prisma#L357). El sistema compila y expone sus datos en un JSON de portabilidad.
    *   Al solicitar la cancelacion de su cuenta, el sistema borra de forma definitiva las evidencias fotograficas y GPS del estudiante, y ejecuta el algoritmo de anonimizacion sobre la tabla de chats.
    *   Las tareas programadas depuran permanentemente los historicos de mensajes de chat antiguos para cumplir con la ley.

---

## 3. Modulos Tecnicos Detallados y Criptografia

Esta seccion explica el funcionamiento interno y algoritmos detallados de los componentes criticos del sistema.

### 3.1 Autenticacion Biometrica Passwordless (WebAuthn)
WebAuthn permite usar la huella dactilar o reconocimiento facial nativo del dispositivo del usuario como credencial criptografica, eliminando contraseñas.

#### Intercambio de Mensajes de Registro (Enrollment Flow):
```
Cliente (Navegador)                   Servidor (NestJS)
       │                                     │
       ├─► 1. Solicitar opciones de Reg. ───►┤
       │                                     │ [WebauthnService]
       │                                     │ Genera Challenge aleatorio
       │                                     │ y lo guarda en User.webauthnChallenge
       ├─◄ 2. Enviar opciones de Reg. ───────┤
       │                                     │
   [Sensor Biométrico]                       │
   Navegador abre Pop-up.                    │
   Usuario coloca su huella.                 │
   Hardware genera par de llaves             │
   (Pública y Privada).                      │
   Firma el Challenge con la privada.        │
       │                                     │
       ├─► 3. Enviar llave pública y firma ─►┤
       │                                     │ [WebauthnService]
       │                                     │ Valida firma contra el Challenge.
       │                                     │ Guarda llave pública en UserCredential.
       │                                     │ Borra User.webauthnChallenge.
       ├─◄ 4. Retornar éxito (Registro OK) ──┤
```

#### Intercambio de Mensajes de Autenticacion (Login Flow):
```
Cliente (Navegador)                   Servidor (NestJS)
       │                                     │
       ├─► 1. Solicitar opciones de Auth. ──►┤
       │                                     │ [WebauthnService]
       │                                     │ Recupera credencial.id de base de datos.
       │                                     │ Genera nuevo Challenge y lo guarda.
       ├─◄ 2. Enviar opciones de Auth. ──────┤
       │                                     │
   [Sensor Biométrico]                       │
   Navegador abre Pop-up.                    │
   Firma el Challenge con la privada         │
   guardada en el hardware.                  │
       │                                     │
       ├─► 3. Enviar Firma del Challenge ───►┤
       │                                     │ [WebauthnService]
       │                                     │ Recupera llave pública de UserCredential.
       │                                     │ Verifica firma. Comprueba que el counter
       │                                     │ sea mayor al anterior (evita replay attack).
       │                                     │ Genera Token JWT de sesión.
       ├─◄ 4. Enviar Token JWT (Login OK) ───┤
```

*   **Implementacion en el Servidor:** Ubicado en [webauthn.service.ts](./api-emitesis/src/webauthn/webauthn.service.ts). Utiliza la biblioteca `@simplewebauthn/server` para orquestar la generacion de retos criptograficos y validar las respuestas.
*   **Implementacion en el Cliente:** Ubicado en [useWebAuthn.ts](./web-emitesis/src/hooks/useWebAuthn.ts). Utiliza `@simplewebauthn/browser` para invocar al hardware del sistema operativo. Maneja de forma resiliente excepciones comunes de la API del navegador (`NotAllowedError` si el usuario cancela, `SecurityError` si no se usa HTTPS).

### 3.2 Doble Factor de Autenticacion (TOTP 2FA)
Provee un mecanismo de verificacion de identidad en dos pasos basado en el algoritmo TOTP (Time-Based One-Time Password).

```
[Servidor NestJS] ──► Genera Secreto Compartido (Base32)
       │
       ├──► 1. Genera URI de vinculación (otpauth://totp/...)
       │
       ├──► 2. Renderiza como Código QR (Imagen Base64) ──► [Celular del Usuario (Google Authenticator)]
                                                                    │
[Servidor NestJS] ◄── 3. Verifica Código de 6 dígitos ingresado ◄────┘
  (Tolerancia de 300s mediante window: 10)
```

*   **Implementacion:** Ubicado en [two-factor-auth.service.ts](./api-emitesis/src/auth/two-factor-auth.service.ts).
*   **Logica del Algoritmo:**
    1.  Genera una clave compartida secreta de 32 caracteres codificada en base32.
    2.  Genera un codigo QR en base a una URI formateada que el usuario escanea con aplicaciones autenticadoras (ej. Google Authenticator).
    3.  Al autenticar, el backend valida el codigo de 6 digitos enviado. Se aplica una ventana temporal (`window: 10`) sobre periodos de 30 segundos. Esto significa que el servidor permite codigos correspondientes a 5 intervalos antes y 5 intervalos despues de la hora actual del servidor, tolerando desajustes de reloj en el movil del estudiante de hasta 300 segundos.

### 3.3 Geofencing y Marcaciones de Asistencia
Valida que el estudiante este presente en el lugar de trabajo fisico asignado al momento de marcar asistencia.

*   **Ubicacion del Codigo:** Metodo `createCheckIn` y `createCheckOut` de [attendance.service.ts](./api-emitesis/src/attendance/attendance.service.ts).
*   **Algoritmo Haversine:**
    Calcula la distancia de circulo maximo en la superficie de una esfera (la Tierra) dadas sus coordenadas:
    $$\text{dLat} = \text{lat}_2 - \text{lat}_1, \quad \text{dLon} = \text{lon}_2 - \text{lon}_1 \quad \text{(en radianes)}$$
    $$a = \sin^2\left(\frac{\text{dLat}}{2}\right) + \cos(\text{lat}_1) \cdot \cos(\text{lat}_2) \cdot \sin^2\left(\frac{\text{dLon}}{2}\right)$$
    $$c = 2 \cdot \arctan2(\sqrt{a}, \sqrt{1-a})$$
    $$\text{Distancia} = R \cdot c \quad \text{(donde } R = 6371 \text{ km)}$$
*   **Verificacion de Sedes:**
    Si la asignacion (`Internship`) tiene configuradas multiples ubicaciones permitidas en el campo JSON `allowedLocations`, el sistema recorre cada una de ellas y calcula la distancia Haversine. Si la menor distancia encontrada es menor o igual al radio parametrizado (ej. 250 metros), se autoriza la marcacion y se guarda la desviacion calculada en `distanceKm`.
*   **Pruebas en Desarrollo:**
    Si el flag `testEnabled` esta en `true` dentro del expediente de la practica, el sistema registra la marcacion guardando la desviacion pero no bloquea el flujo si el estudiante esta fuera del rango, permitiendo simular asistencias en el desarrollo de la tesis. En produccion, con el flag desactivado, arrojara un codigo de error HTTP 400.

### 3.4 Certificados en PDF y Firma Digital
Genera de manera desatendida el certificado de culminacion una vez que el expediente academico cumple con todos los requisitos.

*   **Ubicacion del Codigo:** [certification.service.ts](./api-emitesis/src/certification/certification.service.ts).
*   **Logica del Flujo:**
    1.  **Filtro de Requisitos:** El metodo `checkEligibility` valida matematicamente que el total de horas acumuladas y aprobadas en asistencias sea igual o mayor al requerido, que las evaluaciones academica y empresarial existan en la base de datos, y que no existan documentos pendientes de revision o rechazados.
    2.  **Generacion de Plantilla:** Carga el archivo HTML base `src/templates/certificate.hbs` e interpola las variables del estudiante usando Handlebars.
    3.  **Compilacion Puppeteer:** Abre una instancia de navegador headless (`puppeteer.launch`), inyectando parametros defensivos para servidores Linux de bajos recursos (`--no-sandbox`, `--disable-setuid-sandbox`). Carga el contenido compilado en una pestaña en memoria y genera un PDF en formato horizontal apaisado.
    4.  **Sello Criptografico:** Genera un token alfanumerico inmutable (`verificationCode`) y lo inserta en la base de datos junto con una firma electronica simulada (`signatureKey`). Genera una URL de validacion publica en un codigo QR impreso en el PDF, permitiendo a cualquier tercero escanear el certificado fisico y corroborar su validez consultando el endpoint `/api/certification/verify/:code`.

### 3.5 Copiloto OpenAI GPT-4o e Integracion de IA
El modulo de IA en [ai.service.ts](./api-emitesis/src/ai/ai.service.ts) implementa servicios de apoyo operativo:
1.  **Copiloto NEXO:** Recibe la pregunta del estudiante. Antes de enviarla a la API de OpenAI, el backend inyecta en el prompt del sistema un JSON estruturado con el expediente exacto del estudiante (horas registradas, documentos pendientes, plazos). Esto asegura respuestas contextuales exactas, prohibiendo al modelo alucinar respuestas fuera del ambito institucional.
2.  **OCR Documental:** El estudiante sube un documento PDF. El backend renderiza la primera pagina y envia la imagen a GPT-4o (Vision). El prompt exige una respuesta JSON que valide si el nombre del estudiante y el titulo del documento coinciden con el expediente y extrae de forma matematica las horas declaradas en el texto para compararlas con la base de datos.
3.  **Tolerancia a Fallos:** Si la API de OpenAI no responde (agotamiento de tokens, problemas de red o caida de servicio), el backend captura el error de forma controlada (`try-catch`), permitiendo que la transaccion continue. Retorna un mensaje amigable al cliente avisando que la pre-verificacion automatica no esta disponible en ese momento y que el documento pasara directamente a revision humana del tutor sin bloquear la operacion del estudiante.

### 3.6 Estrategia de Almacenamiento (Storage Service)
En lugar de depender de servicios de almacenamiento en la nube costosos e inestables en entornos locales:
*   **Ubicacion del Codigo:** [storage.service.ts](./api-emitesis/src/infrastructure/storage/storage.service.ts).
*   **Persistencia Local con Docker:** Implementa almacenamiento en el sistema de archivos del servidor (directorio `uploads` en la raiz de la aplicacion).
*   **Docker Volumes:** En produccion, este directorio `uploads` se mapea a un volumen persistente en el servidor VPS de AWS (`docker-compose.prod.yml`). Esto garantiza que los archivos PDF e imagenes subidos por los estudiantes no se borren cuando el contenedor Docker de la API de NestJS se actualice o se reconstruya a traves del pipeline CD.

---

## 4. DevOps, Provisionamiento y Hardening del Servidor VPS

Esta seccion explica la infraestructura de red, seguridad perimetral y como se despliega la aplicacion paso a paso.

### 4.1 Neon Serverless (Desarrollo) vs Postgres Local (Produccion VPS)
Para optimizar costos y agilizar el desarrollo, el sistema esta diseñado para trabajar con bases de datos aisladas:
*   **Desarrollo Local:** Configurado en `api-emitesis/.env`. Se conecta a una base de datos PostgreSQL serverless en la nube de Neon. Permite realizar migraciones y modificaciones de prueba rapidamente.
*   **Produccion VPS AWS:** Configurado en `~/emitesis/.env` en la VPS. La base de datos corre localmente como un contenedor Docker (`db`). No expone puertos al exterior para proteger los datos de ataques de inyeccion de red o ataques de fuerza bruta al puerto 5432.
*   **Script de Sincronizacion:** El script de despliegue de GitHub Actions reescribe en caliente el archivo `.env` del servidor de produccion, inyectando las credenciales locales de la red de Docker (`postgresql://postgres:EmitesPass2026@db:5432/emitesis_db`) y alineando de forma automatica las variables del dominio de produccion (`WEBAUTHN_RP_ID`, `WEBAUTHN_ORIGIN`, `PUBLIC_APP_URL`).

### 4.2 Hardening y Seguridad de VPS
Para proteger la maquina virtual de AWS Lightsail contra accesos maliciosos:
*   **Script de Configuracion:** [setup-vps.sh](./scripts/ops/setup-vps.sh) se ejecuta al inicializar el servidor.
*   **Hardening del Firewall (UFW):**
    1.  Establece politicas restrictivas denegando por defecto todo el trafico entrante (`ufw default deny incoming`).
    2.  Bloquea y cierra todos los puertos de desarrollo del backend (`5000`), frontend (`3005`) y base de datos (`5432`).
    3.  Abre unicamente los puertos indispensables para operacion basica: `22` (SSH para administracion), `80` (HTTP para enrutamiento) y `443` (HTTPS para navegacion segura).
*   **Servidor Nginx como Proxy Inverso:**
    *   Ubicado en [nginx.conf](./nginx.conf). Actua como el unico receptor publico de solicitudes del servidor en los puertos 80 y 443.
    *   Si la peticion va dirigida al dominio principal, la redirige internamente a la App Web en el puerto 3005. Si va dirigida a la ruta `/api` o `/auth`, la redirige a la API NestJS en el puerto 5000.
    *   Inyecta cabeceras de seguridad estrictas (evita clickjacking, inyecciones XSS y limita el acceso a la camara o localizacion solo a dominios seguros bajo HTTPS).

### 4.3 Tarea Programada de Respaldo (Backup)
El script [backup-db.sh](./scripts/ops/backup-db.sh) se ejecuta diariamente en la VPS a las 03:00 AM mediante una tarea del programador de tareas del sistema operativo (Cron Job).
1.  **Extraccion Segura:** Lee las credenciales y nombre de base de datos directamente del `.env` de produccion inyectado en el servidor.
2.  **Volcado Comprimido:** Ejecuta un comando `pg_dump` dentro del contenedor Docker `db` y comprime el resultado con `gzip` en la ruta `~/emitesis/backups/`.
3.  **Permisos Restringidos:** Aplica el comando `chmod 600` sobre el archivo de respaldo generado, garantizando que unicamente el usuario administrador del sistema operativo del servidor pueda leer o restaurar ese respaldo.
4.  **Rotacion Dinamica:** Para evitar saturar el disco duro de la VPS, el script ejecuta un barrido buscando respaldos con mas de 30 dias de antigüedad y los elimina permanentemente de forma automatica.

---

## 5. Guia de Ejecucion Local y Resolucion de Problemas (Troubleshooting)

Para levantar el sistema de forma local en computadores personales de desarrollo o demostracion de tesis, siga esta guia de pasos:

### 5.1 Prerrequisitos
Tener instalado en el ordenador:
*   Node.js v20 o v22 (LTS recomendado).
*   Docker y Docker Desktop configurado y ejecutandose.
*   Git.

### 5.2 Pasos de Arranque
1.  **Clonar e Instalar Dependencias:**
    Abra una terminal en la carpeta raiz del proyecto y ejecute:
    ```bash
    npm install
    ```
2.  **Configurar e Inicializar la Base de Datos de Desarrollo:**
    *   **Opción A (Recomendado - PostgreSQL Local en la Laptop):**
        Si tienes PostgreSQL instalado en el sistema local (fuera de Docker o ya activo en Docker), asegúrate de que el servicio de Postgres esté iniciado y ejecuta:
        ```bash
        npm run setup:local-db
        ```
        *(Este comando automatizado e interactivo permite ingresar las credenciales locales de Postgres, crea la base de datos si no existe, genera el cliente de Prisma, sincroniza las tablas y carga los datos de prueba/seeders automáticamente).*
    *   **Opción B (Docker Compose):**
        Levanta el contenedor de Postgres y realiza la configuración corriendo:
        ```bash
        npm run docker:up
        ```
        *(Este comando levanta PostgreSQL en Docker en el puerto 5432 y crea el archivo .env. Luego deberás ejecutar `npm run setup` para inicializar y poblar la base de datos).*
3.  **Iniciar Servidores en Desarrollo:**
    Para levantar la API (backend) en el puerto 5000 y la App Web (frontend) en el puerto 3005 de forma paralela en una sola terminal, ejecute:
    ```bash
    npm run dev
    ```
    *Abra su navegador e ingrese a `http://localhost:3005` para interactuar con el sistema.*

### 5.3 Resolucion de Errores Frecuentes
*   **Error P3005 (database schema is not empty):**
    *   **Causa:** Se ejecuto un comando destructivo como `prisma db push` sin control de versiones sobre una base de datos que ya contenia tablas, lo que provoco que Prisma perdiera el rastro de la tabla `_prisma_migrations`.
    *   **Solucion:** Vacie la base de datos y recreela correctamente ejecutando:
        ```bash
        npx prisma migrate reset --force
        ```
*   **Error: Cannot find module dist/main.js al arrancar Docker:**
    *   **Causa:** No se ha compilado el codigo de NestJS antes de levantar el contenedor o la directiva en el `Dockerfile` apunta a una ruta incorrecta.
    *   **Solucion:** Asegurese de ejecutar `npm run build` en el workspace de `api-emitesis` o verifique que el docker-compose productivo inyecte el comando correcto `node dist/main.js`.
*   **Fallo al Registrar Biometria (SecurityError / NotAllowedError):**
    *   **Causa:** La API WebAuthn del navegador exige obligatoriamente conexiones cifradas HTTPS para funcionar. Si esta probando en desarrollo local, unicamente funcionara a traves del dominio especial `localhost`. Si prueba usando una direccion IP local (ej. `http://192.168.1.10:3005`), el navegador bloqueara la biometria por seguridad.
    *   **Solucion:** Acceda al sistema usando siempre la direccion literal `http://localhost:3005`. En produccion, asegurese de contar con certificados SSL validos en Nginx.

---

## 6. Cuestionario de Simulacion para la Defensa de Tesis (20 Preguntas Clave)

Preguntas y respuestas estructuradas en primera persona para que el estudiante simule la defensa de grado ante el tribunal de evaluacion cientifica:

### 6.1 ¿Como garantiza el sistema que el estudiante no marque asistencia desde su domicilio alterando la ubicacion GPS mediante herramientas de desarrollo del navegador?
"Diseñe el modulo de control de asistencia bajo el principio de desconfianza absoluta del cliente. El frontend Next.js unicamente obtiene la localizacion nativa del dispositivo y la envia al backend. El servidor NestJS implementa de forma centralizada en el metodo privado `calculateDistance` de [AttendanceService](./api-emitesis/src/attendance/attendance.service.ts) la formula del Haversine, la cual calcula la distancia geometrica real de la marcacion contra el listado JSON de sedes permitidas (`allowedLocations`) configurado en el expediente relacional de base de datos de la practica. Si la desviacion calculada es superior al radio de tolerancia establecido (por defecto 250 metros), el backend deniega la transaccion arrojando un codigo de error HTTP 400. Adicionalmente, el marcaje exige autenticacion WebAuthn (Passkeys), la cual valida criptograficamente a traves del hardware del dispositivo movil la identidad y presencia del estudiante en el momento exacto del registro."

### 6.2 ¿Como se calculan ponderadamente los de indicadores que componen el Indice de Salud (Health Score) y que penalizaciones aplican?
"El Indice de Salud se calcula programaticamente en el metodo `calculateHealthScore` de [InternshipsService](./api-emitesis/src/internships/internships.service.ts). Este unifica 4 criterios ponderados:
1.  **Documentos (40%):** Proporcion de archivos con estado `APROBADO_DEFINITIVO` respecto al total del expediente.
2.  **Asistencia (30%):** Horas reales marcadas en bitacoras en relacion con las horas obligatorias parametrizadas por la carrera.
3.  **Rubricas (30%):** Calificacion promedio de las evaluaciones academicas y empresariales en base a una escala de 5 estrellas.
4.  **Penalizaciones:** Deduccion directa de 5 puntos al valor total por cada documento obligatorio que supere su fecha limite de entrega, cambiando de forma automatica a estado `INCUMPLIDO` mediante la tarea programada a la medianoche."

### 6.3 ¿De que forma se implementa la inmutabilidad documental para evitar que calificaciones o informes aprobados sean reemplazados en base de datos?
"La inmutabilidad se rige a nivel del controlador y servicio de documentos. Cuando un documento del expediente academico es aprobado por el coordinador de carrera transicionando su estado a `APROBADO_DEFINITIVO`, el backend NestJS bloquea cualquier modificacion. Los metodos de edicion (`updateDates`, `uploadDocument`, `reviewDocument` y `deleteDocumentFile`) en [DocumentsService](./api-emitesis/src/documents/documents.service.ts) evaluan de forma prioritaria el estado del archivo. Si este se encuentra aprobado definitivamente, se aborta la operacion arrojando un error `HTTP 400 BadRequestException`, blindando el registro de cualquier alteracion o borrado posterior."

### 6.4 ¿De que manera se previene el acceso no autorizado de usuarios malintencionados que intenten explorar expedientes mediante tecnicas de ID Enumeration (IDOR)?
"Para mitigar ataques de Broken Access Control (OWASP Top 1), el metodo `findOne` de [InternshipsService](./api-emitesis/src/internships/internships.service.ts) valida estrictamente la relacion de propiedad del recurso. Si un actor no administrativo (Estudiante, Tutor o Empresa) intenta consultar un expediente que no le pertenece, la peticion se deniega arrojando una excepcion `403 Forbidden`. Al mismo tiempo, se dispara un registro de auditoria especializado en SystemLog bajo la categoria `AUTH` con severidad `HIGH` tipo `ID_ENUMERATION`, permitiendo a los administradores identificar de forma inmediata intentos de escaneo maliciosos de la API."

### 6.5 ¿Como se garantiza la privacidad del estudiante y la trazabilidad de accesos a sus datos personales (Derecho de Acceso y Acceso Consolidado LOPDP)?
"El sistema cuenta con un control de accesos transparente. Cuando un coordinador, tutor o administrador consulta la informacion privada de un estudiante, el backend intercepta el acceso y registra un log de auditoria forense en la tabla SystemLog con la categoria `PRIVACY` y la metadata de impacto `PERSONAL_DATA_EXPOSURE`. Asimismo, el sistema implementa un controlador de privacidad en [PrivacyService](./api-emitesis/src/privacy/privacy.service.ts) donde el estudiante puede ejercer su derecho de acceso y descargar de forma estructurada en un archivo JSON todos sus datos de perfil, ubicaciones y bitacoras de marcacion, garantizando total transparencia en el tratamiento de su informacion."

### 6.6 ¿Como se previene la retencion indefinida de informacion personal en el modulo de comunicacion interna bajo el Articulo 16 de la LOPDP?
"El sistema implementa de forma automatica el principio de minimizacion de datos. Contamos con una tarea programada denominada [ChatTask](./api-emitesis/src/chat/chat.task.ts) que se ejecuta todos los dias a las 03:00 AM en segundo plano. Este cron lee la clave de configuracion `chat_message_retention_days` (por defecto 730 dias) de la tabla de configuraciones globales y ejecuta una query de eliminacion permanente sobre la tabla ChatMessage para todos aquellos registros cuya fecha de creacion sea anterior al limite permitido, depurando de forma no reversible los historicos de mensajes obsoletos del servidor."

### 6.7 ¿Como se maneja la consistencia de firmas en dispositivos con desajustes de reloj durante el proceso de autenticacion multifactor (TOTP 2FA)?
"El backend implementa la biblioteca `otplib` para resolver la verificacion del doble factor. En [TwoFactorAuthService](./api-emitesis/src/auth/two-factor-auth.service.ts), configuramos el validador autenticador estableciendo una configuracion de ventana igual a 10 (`window: 10`) y un paso de 30 segundos (`step: 30`). Esto significa que el servidor tolerara codigos generados hasta 300 segundos antes o despues de la hora oficial del servidor (drift temporal), permitiendo que usuarios con dispositivos desincronizados completen la validacion sin rechazos accidentales."

### 6.8 ¿Cual es el flujo de aprovisionamiento inicial y despliegue del servidor utilizando herramientas DevOps (Terraform e Integracion Continua)?
"El ciclo se compone de tres fases automatizadas:
1.  **Provisionamiento (IaC):** Terraform lee [main.tf](./infra/main.tf), crea la maquina virtual VPS en AWS Lightsail, configura el User Data en bash para aprovisionar Docker y activa el firewall defensivo abriendo unicamente los puertos `22`, `80` y `443`.
2.  **Integracion Continua (CI):** Ante cada cambio en la rama `main` en GitHub, se ejecutan analisis de seguridad, compilaciones estrictas de TypeScript y ejecucion de pruebas unitarias/e2e en Jest.
3.  **Despliegue Continuo (CD):** GitHub Actions publica las imagenes de produccion en el registro GHCR, se conecta via SSH a la VPS de AWS y ejecuta `ensure-migrations.sh` para levantar de forma segura las actualizaciones bajo Nginx con terminacion SSL."

### 6.9 ¿Como funciona la pre-verificacion de documentos mediante Inteligencia Artificial y como se evita que apruebe archivos corruptos o ilegibles?
"El metodo `preVerifyDocument` en [AiService](./api-emitesis/src/ai/ai.service.ts) recibe la primera pagina del PDF renderizada como imagen en base64. Invoca al modelo `gpt-4o` con un prompt del sistema estructurado en JSON que define criterios de calidad documental (presencia del nombre del estudiante, coincidencia del titulo y extraccion OCR de las horas declaradas). Si la IA detecta discrepancias de nombre o de horas, responde con la bandera `isValid: false` y expone un feedback especifico. En caso de fallas de conexion o caida de la API de OpenAI, el servicio captura la excepcion de forma tolerante a fallos retornando `isValid: true` y una advertencia en el feedback, permitiendo al estudiante continuar con el flujo de carga manual para su revision humana tradicional por parte de su tutor."

### 6.10 ¿Cual es la diferencia en el diseño del entorno de Base de Datos entre el ambiente de Desarrollo Local y el ambiente de Produccion en la VPS?
"En el entorno local de desarrollo, el sistema utiliza de forma flexible una base de datos serverless en la nube con Neon, lo que permite a los desarrolladores correr la aplicacion rapidamente mediante `npm run dev` sin depender de motores locales. En cambio, en produccion sobre la VPS de AWS, la base de datos se ejecuta de forma activa y dockerizada como un contenedor PostgreSQL (`db`) dentro de una red interna de Docker compose, sin exponer su puerto `5432` al exterior. El almacenamiento persistente de produccion esta vinculado a volumenes locales y protegido mediante el script de respaldo comprimido diario `backup-db.sh` con politicas de rotacion a 30 dias."

### 6.11 ¿Como implementa la LOPDP el derecho de Cancelacion en el historial de chats sin romper la continuidad del hilo de conversacion del receptor?
"Desarrolle un algoritmo de anonimizacion en dos fases en `chatService.anonymizeUserChatData`. Cuando se aprueba una solicitud de cancelacion de datos LOPDP de un estudiante, el sistema realiza una purga selectiva:
1.  Query masiva de actualizacion (`updateMany`) en `ChatMessage` que localiza todos los mensajes del usuario emisor, reemplaza permanentemente su contenido por la cadena `'[Contenido eliminado — solicitud de privacidad LOPDP]'`, y establece el indicador booleano `isAnonymized: true`.
2.  Eliminacion permanente (`deleteMany`) en la tabla `ChatRoomMember` vinculada a ese ID, desvinculando de forma irreversible su cuenta fisica del historial. De este modo, el hilo del chat se mantiene legible para los otros interlocutores (ej. tutores), pero los datos personales del emisor quedan eliminados."

### 6.12 ¿Como se maneja la consistencia de los mensajes eliminados por iniciativa propia del remitente frente a la LOPDP y que ventana de tiempo se permite?
"Conforme al Derecho de Supresion (Art. 22 LOPDP), implemente el metodo `softDeleteMessage` de [ChatService](./api-emitesis/src/chat/chat.service.ts). El emisor puede eliminar un mensaje de chat enviado por error, pero el backend restringe esta operacion a una ventana estricta de **24 horas** a partir del momento de envio. Si se solicita la eliminacion dentro de este plazo, el servidor cambia el contenido del mensaje por la cadena `'[Mensaje eliminado]'` y registra `deletedAt` en base de datos. Si se intenta realizar la accion pasada las 24 horas, el backend devuelve un fallo `403 Forbidden`, ya que las bitacoras academicas y el historial pasan a formar parte del interes legitimo y trazabilidad del expediente academico institucional."

### 6.13 ¿Por que el sistema utiliza un servidor de Nginx como proxy inverso y no permite la conexion directa al puerto 5000 de la API?
"Por principios de seguridad perimetral y abstraccion de la infraestructura. Si expusieramos directamente la aplicacion NestJS al internet en el puerto 5000, estariamos vulnerables a ataques dirigidos al runtime de Node, ademas de dificultar el control de certificados SSL de forma centralizada. Nginx en [nginx.conf](./nginx.conf) actua como el unico escudo publico (puertos 80 y 443), gestionando la terminacion de la capa de transporte seguro (SSL/TLS), inyectando cabeceras HTTP defensivas contra inyeccion de scripts y distribuyendo de forma optima las peticiones web y de API a los contenedores internos a traves de la red privada aislada de Docker."

### 6.14 ¿Que sucede si las coordenadas GPS de la empresa registradas originalmente estan a mas de 250 metros de la oficina del estudiante debido a una mala precision del satelite?
"El sistema implementa dos vias de solucion. Primero, de forma transaccional, el Coordinador puede configurar en la tabla `Internship` el campo `allowedLocations`, el cual permite definir multiples sedes autorizadas para una misma practica e incluso parametrizar radios de tolerancia personalizados en metros (ej. 500 metros para zonas de campo o proyectos de infraestructura). Segundo, si persiste un error de hardware, el estudiante puede utilizar la marcacion y el sistema registrara el desvio en base de datos en el campo `distanceKm` y solicitara la respectiva bitacora y foto de actividades diaria. Si el flag `testEnabled` esta activado (utilizado para pruebas de defensa), la marcacion se procesara sin bloqueos."

### 6.15 ¿Como funciona la firma digital del certificado de culminacion generado y como se verifica su autenticidad?
"El backend NestJS no realiza una firma con token fisico gubernamental, sino que implementa una firma digital institucional simulada basada en metadatos criptograficos persistidos en base de datos. En [CertificationService](./api-emitesis/src/certification/certification.service.ts), generamos un identificador hexadecimal unico (`verificationCode`) y un hash criptografico del contenido del certificado en base a la clave publica de la institucion, registrando dichos datos en la tabla `Document` (en la celda asignada al certificado de culminacion). En el certificado PDF generado por Puppeteer, se renderiza un codigo QR que apunta al endpoint de validacion publica. Si un tercero escanea el codigo, el servidor consulta la base de datos y confirma si el certificado fue emitido oficialmente y si coincide con los datos del pasante registrado."

### 6.16 ¿De que forma el sistema maneja la persistencia de los archivos PDF cargados por los estudiantes si los contenedores Docker son efimeros?
"Los contenedores de Docker por naturaleza son efimeros, lo que significa que cualquier archivo guardado en su espacio de almacenamiento interno se destruye al reiniciar el servicio. Para solventar esto, implementamos un volumen de Docker (`Docker Volumes`) configurado en [docker-compose.prod.yml](./docker-compose.prod.yml). Este volumen mapea de forma persistente la carpeta fisica `uploads` de la VPS hacia el directorio interno `/app/uploads` en el contenedor del backend NestJS. De este modo, aunque el contenedor de la API se destruya y reconstruya en cada despliegue, todos los PDFs y fotos de evidencia permanecen intactos en el disco duro del servidor."

### 6.17 ¿Por que se opto por el uso del modelo de Inteligencia Artificial GPT-4o de OpenAI y que medidas se tomaron para mitigar los costos de la API?
"Se selecciono GPT-4o debido a sus capacidades multimodales nativas, lo que nos permite analizar flujos de vision artificial (OCR en imagenes base64 de las primeras paginas del PDF) y analizar consultas complejas en tiempo real. Para mitigar los costos, el sistema:
1.  **Limita las paginas analizadas:** El OCR de pre-verificacion solo procesa la primera pagina del PDF del estudiante, evitando el envio de archivos extensos de multiples megabytes.
2.  **Limita el tamaño de la respuesta:** Los prompts del sistema exigen respuestas estrictamente formateadas en esquemas JSON compactos, minimizando el consumo de tokens de salida.
3.  **Filtrado de peticiones:** En la descripcion de actividades, el cliente frontend solo permite invocar la sugerencia de IA si se detecta una foto cargada correctamente y no de forma libre o repetitiva."

### 6.18 ¿Como se manejan los errores de conexion con la base de datos en la API NestJS para evitar que el servidor completo se cuelgue ante una caida de red?
"NestJS y Prisma manejan la conexion a traves de pools de hilos de red resilientes. Si ocurre un fallo en la conexion con PostgreSQL, Prisma arroja excepciones de conexion especificas (ej. codigos P1001 o P1002). Estas excepciones son capturadas por el filtro global de excepciones [HttpExceptionFilter](./api-emitesis/src/common/filters/http-exception.filter.ts). Este filtro envia una respuesta estructurada de error HTTP 500 al cliente, evitando fugas de memoria y manteniendo el servicio NestJS en ejecucion para responder a otras rutas locales o solicitudes de cache. Paralelamente, se genera una alerta inmutable en `SystemLog` para que los administradores identifiquen y resuelvan la caida."

### 6.19 ¿Que medidas de seguridad se implementaron para evitar ataques de inyeccion SQL en el sistema?
"El sistema esta blindado por diseño contra inyeccion SQL mediante dos capas. Primero, el uso de Prisma ORM parametriza de manera automatica todas las consultas SQL que genera, separando la logica de ejecucion del comando SQL de los datos enviados por el usuario. Segundo, las peticiones HTTP que ingresan a los controladores NestJS son validadas estrictamente a nivel de tipo mediante DTOs (Data Transfer Objects) decorados con la libreria `class-validator` (como `@IsString()`, `@IsUUID()`), rechazando de entrada cualquier payload que intente inyectar caracteres o comandos maliciosos."

### 6.20 ¿De que forma el sistema asiste a los tutores academicos a identificar tempranamente a estudiantes en riesgo de no culminar sus practicas?
"El sistema implementa el Dashboard de Monitoreo Predictivo basado en el Indice de Salud (Health Score) y analisis de IA. El Coordinador y Tutor academico pueden ver en sus paneles una lista de pasantes categorizados por nivel de riesgo (Bajo, Medio, Alto). El algoritmo [InternshipsService](./api-emitesis/src/internships/internships.service.ts) evalua constantemente las variables de avance. Si un estudiante tiene un Health Score bajo, el Tutor puede invocar al modulo de IA en [AiService](./api-emitesis/src/ai/ai.service.ts) para que analice de forma predictiva las causas exactas (ej: documentos obligatorios no cargados a tiempo o tasa de asistencia deficiente) y recomiende una estrategia de intervencion personalizada al docente."
