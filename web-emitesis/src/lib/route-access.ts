import { Role, ROLES, ROLE_REDIRECTS } from "@/constants/roles";

/**
 * Reglas de acceso por ruta (prefijos más específicos primero).
 * Alineado con los 6 roles del sistema y con los guards de la API.
 */
const RULES: { match: RegExp; allow: Role[] }[] = [
  { match: /^\/admin(\/|$)/, allow: [ROLES.ADMIN] },
  { match: /^\/coordinador(\/|$)/, allow: [ROLES.ADMIN, ROLES.COORDINADOR] },
  { match: /^\/tutor-academico\/perfil/, allow: [ROLES.ADMIN, ROLES.TUTOR_ACADEMICO] },
  { match: /^\/tutor-academico(\/|$)/, allow: [ROLES.ADMIN, ROLES.TUTOR_ACADEMICO] },
  { match: /^\/empresa\/perfil/, allow: [ROLES.ADMIN, ROLES.EMPRESA, ROLES.TUTOR_EMPRESARIAL] },
  { match: /^\/empresa(\/|$)/, allow: [ROLES.ADMIN, ROLES.EMPRESA, ROLES.TUTOR_EMPRESARIAL] },
  { match: /^\/dashboard\/perfil/, allow: [ROLES.ADMIN, ROLES.COORDINADOR, ROLES.TUTOR_ACADEMICO, ROLES.ESTUDIANTE] },
  { match: /^\/dashboard\/documentos/, allow: [ROLES.ADMIN, ROLES.COORDINADOR, ROLES.TUTOR_ACADEMICO, ROLES.ESTUDIANTE] },
  { match: /^\/dashboard\/asistencia/, allow: [ROLES.ADMIN, ROLES.COORDINADOR, ROLES.TUTOR_ACADEMICO, ROLES.ESTUDIANTE] },
  { match: /^\/dashboard\/configuracion/, allow: [ROLES.ADMIN, ROLES.COORDINADOR, ROLES.TUTOR_ACADEMICO, ROLES.ESTUDIANTE] },
  { match: /^\/dashboard\/?$/, allow: [ROLES.ADMIN, ROLES.COORDINADOR, ROLES.TUTOR_ACADEMICO, ROLES.ESTUDIANTE] },
];

export function normalizePathname(pathname: string): string {
  const p = pathname.split("?")[0];
  if (p.length > 1 && p.endsWith("/")) return p.slice(0, -1);
  return p || "/";
}

/**
 * Indica si el rol (ya normalizado a TUTOR_ACADEMICO cuando la API envía TUTOR)
 * puede ver la ruta actual.
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
    const dashRoles: Role[] = [ROLES.ADMIN, ROLES.COORDINADOR, ROLES.TUTOR_ACADEMICO, ROLES.ESTUDIANTE];
    return dashRoles.includes(role);
  }

  return true;
}

export function getHomePathForRole(role: Role): string {
  return ROLE_REDIRECTS[role] ?? "/dashboard";
}
