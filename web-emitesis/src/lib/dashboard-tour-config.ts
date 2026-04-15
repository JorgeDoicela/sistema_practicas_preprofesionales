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

/** Pasos del recorrido: solo avanzan al pulsar «Siguiente» (o «Finalizar» en el último). */
export function getDashboardTourSteps(_role: Role): TourStepDef[] {
  return [
    {
      id: "sidebar",
      selector: '[data-tour="sidebar"]',
      title: "Panel lateral",
      getDescription: (rl) =>
        `Como ${roleLabel(rl)}, aquí tiene el acceso principal al sistema: logotipo, nombre del portal y la zona de navegación. Todo el recorrido entre módulos empieza desde este panel.`,
    },
    {
      id: "sidebar-menu",
      selector: '[data-tour="sidebar-navigation"]',
      title: "Menú de secciones",
      getDescription: (rl) =>
        `Las opciones cambian según el rol. Usted entra como **${roleLabel(rl)}**: use cada enlace para abrir tableros, documentos, asistencia u otras herramientas que su institución le haya habilitado. El ítem activo se resalta en blanco.`,
    },
    {
      id: "navbar",
      selector: '[data-tour="navbar"]',
      title: "Barra superior",
      getDescription: () =>
        "Zona de contexto: búsqueda en el portal (si está visible), avisos y el bloque de su cuenta (nombre, rol y menú desplegable para perfil o cerrar sesión).",
    },
    {
      id: "main",
      selector: '[data-tour="dashboard-main"]',
      title: "Área de trabajo",
      getDescription: (rl) =>
        `Aquí se muestra el contenido de la página que eligió en el menú. **${roleLabel(rl)}**: cada pantalla (documentos, asistencia, etc.) ocupa este espacio central.`,
    },
    {
      id: "sidebar-account",
      selector: '[data-tour="sidebar-footer"]',
      title: "Cuenta y salida",
      getDescription: () =>
        "Abajo del menú verá su nombre, rol y el botón para **cerrar sesión** de forma segura. «Mi perfil» y «Configuración» (si aplica) están en el menú lateral.",
    },
  ];
}
