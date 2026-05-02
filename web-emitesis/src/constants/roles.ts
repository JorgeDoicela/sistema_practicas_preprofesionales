export const ROLES = {
  ADMIN: 'ADMIN',
  COORDINADOR: 'COORDINADOR',
  TUTOR_ACADEMICO: 'TUTOR_ACADEMICO',
  ESTUDIANTE: 'ESTUDIANTE',
  EMPRESA: 'EMPRESA',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

export const ROLE_LABELS: Record<Role, string> = {
  [ROLES.ADMIN]: 'Administrador',
  [ROLES.COORDINADOR]: 'Coordinador de Prácticas',
  [ROLES.TUTOR_ACADEMICO]: 'Tutor Académico',
  [ROLES.ESTUDIANTE]: 'Estudiante',
  [ROLES.EMPRESA]: 'Empresa',
};

export const ROLE_REDIRECTS: Record<Role, string> = {
  [ROLES.ADMIN]: '/dashboard',
  [ROLES.COORDINADOR]: '/dashboard',
  [ROLES.TUTOR_ACADEMICO]: '/tutor-academico/dashboard',
  [ROLES.ESTUDIANTE]: '/dashboard',
  [ROLES.EMPRESA]: '/empresa/dashboard',
};

/**
 * La API (Prisma) usa el enum `TUTOR` para el tutor académico.
 * En el cliente unificamos el nombre a `TUTOR_ACADEMICO` para menús, RBAC y etiquetas.
 */
export function normalizeApiRoleToAppRole(apiRole: string): Role {
  const r = (apiRole ?? '').trim();
  if (!r) return ROLES.ESTUDIANTE;
  if (r === 'TUTOR') return ROLES.TUTOR_ACADEMICO;
  const known = Object.values(ROLES) as string[];
  if (known.includes(r)) return r as Role;
  return ROLES.ESTUDIANTE;
}

/**
 * Checks if a user has a specific role or one of multiple roles.
 */
export const hasRole = (userRole: string | undefined, roles: Role | Role[]): boolean => {
  if (!userRole) return false;
  const r = normalizeApiRoleToAppRole(userRole);
  if (Array.isArray(roles)) {
    return roles.includes(r);
  }
  return r === roles;
};

/**
 * Helper to check if user is an admin or coordinador (common check)
 */
export const canManageSystem = (userRole: string | undefined): boolean => {
  return hasRole(userRole, [ROLES.ADMIN, ROLES.COORDINADOR]);
};
