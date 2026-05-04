import { Role, ROLES, ROLE_REDIRECTS } from "@/constants/roles";

/**
 * Reglas de acceso por ruta (prefijos más específicos primero).
 * Alineado con los roles del sistema y con los guards de la API.
 */
const RULES: { match: RegExp; allow: Role[] }[] = [
  // ── Rutas protegidas (orden: más específico primero) ───────────────────────
  { match: /^\/admin(\/|$)/, allow: [ROLES.ADMIN] },
  { match: /^\/coordinador(\/|$)/, allow: [ROLES.ADMIN, ROLES.COORDINADOR] },
  { match: /^\/tutor-academico\/perfil/, allow: [ROLES.ADMIN, ROLES.TUTOR] },
  { match: /^\/tutor-academico(\/|$)/, allow: [ROLES.ADMIN, ROLES.TUTOR] },
  { match: /^\/empresa\/perfil/, allow: [ROLES.ADMIN, ROLES.EMPRESA] },
  { match: /^\/empresa(\/|$)/, allow: [ROLES.ADMIN, ROLES.EMPRESA] },
  // Rutas del estudiante (ruta canónica y aliases legacy)
  { match: /^\/estudiante(\/|$)/, allow: [ROLES.ADMIN, ROLES.ESTUDIANTE] },
  { match: /^\/dashboard\/perfil/, allow: [ROLES.ADMIN, ROLES.COORDINADOR, ROLES.TUTOR, ROLES.ESTUDIANTE] },
  { match: /^\/dashboard\/documentos/, allow: [ROLES.ADMIN, ROLES.COORDINADOR, ROLES.TUTOR, ROLES.ESTUDIANTE] },
  { match: /^\/dashboard\/asistencia/, allow: [ROLES.ADMIN, ROLES.COORDINADOR, ROLES.TUTOR, ROLES.ESTUDIANTE] },
  { match: /^\/dashboard\/configuracion/, allow: [ROLES.ADMIN, ROLES.COORDINADOR, ROLES.TUTOR, ROLES.ESTUDIANTE] },
  { match: /^\/dashboard\/mi-evaluacion/, allow: [ROLES.ADMIN, ROLES.ESTUDIANTE] },
  { match: /^\/dashboard\/ausencias/, allow: [ROLES.ADMIN, ROLES.ESTUDIANTE] },
  { match: /^\/dashboard\/?$/, allow: [ROLES.ADMIN, ROLES.COORDINADOR, ROLES.TUTOR, ROLES.ESTUDIANTE] },
  // Rutas legacy de tutor (alias de /tutor-academico)
  { match: /^\/tutor(\/|$)/, allow: [ROLES.ADMIN, ROLES.TUTOR] },
  // Rutas legacy de tutor empresarial (alias de /empresa)
  { match: /^\/tutor-empresarial(\/|$)/, allow: [ROLES.ADMIN, ROLES.EMPRESA] },
];

export function normalizePathname(pathname: string): string {
  const p = pathname.split("?")[0];
  if (p.length > 1 && p.endsWith("/")) return p.slice(0, -1);
  return p || "/";
}

/**
 * Indica si el rol puede ver la ruta actual.
 */
export function canRoleAccessPath(role: Role | undefined, pathname: string): boolean {
  if (!role) return false;
  const p = normalizePathname(pathname);

  for (const rule of RULES) {
    if (rule.match.test(p)) {
      return rule.allow.includes(role);
    }
  }

  if (p.startsWith("/dashboard")) {
    const dashRoles: Role[] = [ROLES.ADMIN, ROLES.COORDINADOR, ROLES.TUTOR, ROLES.ESTUDIANTE];
    return dashRoles.includes(role);
  }

  // Rutas públicas accesibles sin rol
  const PUBLIC_PATHS = [
    "/", "/login", "/reset-password", "/olvido-password",
    "/verificar", "/nosotros", "/servicios", "/privacidad", "/empresas",
  ];
  if (PUBLIC_PATHS.some((pub) => p === pub || p.startsWith(pub + "/"))) {
    return true;
  }

  // Cualquier otra ruta protegida sin regla explícita → denegar por defecto
  return false;
}

export function getHomePathForRole(role: Role): string {
  return ROLE_REDIRECTS[role] ?? "/dashboard";
}
