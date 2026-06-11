# Praxis Hub Web Client - Frontend (Next.js)

La aplicación cliente de **Praxis Hub** es una interfaz web moderna, responsiva e interactiva construida sobre **Next.js 16 (App Router)**, **React 19** y **Tailwind CSS**. Implementa una experiencia de usuario premium con animaciones fluidas, estados de carga mediante Skeleton UI, y total accesibilidad multirrol.

---

## Stack Tecnológico Integrado

*   **Framework:** Next.js 16 (App Router) y React 19.
*   **Estilos y Animaciones:** Tailwind CSS con variables HSL personalizadas y Framer Motion para micro-animaciones premium.
*   **Gestión de Estados e Hilos:** React Query (`@tanstack/react-query`) para consultas cacheadas eficientes y sincronización.
*   **Cliente HTTP:** Axios estructurado en servicios tipo hooks en `src/services/`.
*   **Mapas y Geolocalización:** Leaflet (`react-leaflet`) para visualización de sedes corporativas y marcación GPS en mapa.
*   **Autenticación Criptográfica:** Cliente WebAuthn (`@simplewebauthn/browser`) integrado con el hardware biométrico del dispositivo.
*   **Soporte Multilingüe:** Sistema propio de internacionalización (i18n) en `src/i18n/` para traducción al instante (Español/Inglés).
*   **Seguridad:** Google reCAPTCHA v3 para registro seguro de empresas.

---

## Configuración y Ejecución Local

### Requisitos
*   Node.js (v22+)
*   npm (v10+)

### Configuración de Variables de Entorno
Crea un archivo `.env.local` en la raíz de esta subcarpeta (`web-emitesis/`) y define las siguientes variables:
```env
NEXT_PUBLIC_API_URL="http://localhost:5000"
NEXT_PUBLIC_RECAPTCHA_SITE_KEY="su_recaptcha_site_key"
```

### Comandos de Desarrollo

1.  **Instalar dependencias:**
    ```bash
    npm install
    ```
2.  **Iniciar el servidor Next.js en modo desarrollo:**
    ```bash
    npm run dev
    ```
    La aplicación estará disponible en `http://localhost:3005`.
3.  **Compilar la aplicación para producción:**
    ```bash
    npm run build
    ```
4.  **Iniciar en modo producción:**
    ```bash
    npm run start
    ```

---

## Estructura del Proyecto

*   `src/app`: Rutas de Next.js. Contiene la página principal `/` y subrutas de Dashboard `/dashboard/*`.
*   `src/components`: Componentes reutilizables de UI (botones, modales, layouts, gráficos de Recharts, etc.).
*   `src/services`: Capa de consumo de API encapsulada en React Hooks para aislar lógica de vistas.
*   `src/providers`: Contenedores globales de React (React Query Provider, Theme Provider, Locale Provider).
*   `src/i18n`: Archivos de idioma (`es.ts` y `en.ts`) y utilidades de traducción dinámica.
*   `src/lib`: Configuraciones fijas, tours guiados e interactivos para el dashboard.
*   `public`: Archivos estáticos, logos, manifest PWA, etc.

---

## Características Premium de la Interfaz

1.  **Dashboard Multirrol Dinámico:** Paneles personalizados para Estudiante, Tutor Académico, Empresa y Administrador.
2.  **AI Copilot Chat Widget:** Asistente contextual con interfaz interactiva en la esquina inferior derecha.
3.  **Tour de Inducción:** Guía paso a paso sobre el funcionamiento de los widgets para los nuevos usuarios.
4.  **Skeletons Fluidos:** Evita saltos visuales durante la carga asíncrona de datos.
5.  **Presencia en Vivo:** Widgets corporativos que muestran en tiempo real los pasantes marcados en las sedes.
