export const ROLES = {
  ADMIN: 'ADMIN',
  COORDINADOR: 'COORDINADOR',
  TUTOR_ACADEMICO: 'TUTOR_ACADEMICO',
  TUTOR_EMPRESARIAL: 'TUTOR_EMPRESARIAL',
  ESTUDIANTE: 'ESTUDIANTE',
  EMPRESA: 'EMPRESA',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

export const ROLE_LABELS: Record<Role, string> = {
  [ROLES.ADMIN]: 'Administrador',
  [ROLES.COORDINADOR]: 'Coordinador de Prácticas',
  [ROLES.TUTOR_ACADEMICO]: 'Tutor Académico',
  [ROLES.TUTOR_EMPRESARIAL]: 'Tutor Empresarial',
  [ROLES.ESTUDIANTE]: 'Estudiante',
  [ROLES.EMPRESA]: 'Empresa',
};

export const ROLE_REDIRECTS: Record<Role, string> = {
  [ROLES.ADMIN]: '/dashboard',
  [ROLES.COORDINADOR]: '/dashboard',
  [ROLES.TUTOR_ACADEMICO]: '/tutor-academico/dashboard',
  [ROLES.TUTOR_EMPRESARIAL]: '/empresa/dashboard',
  [ROLES.ESTUDIANTE]: '/dashboard',
  [ROLES.EMPRESA]: '/empresa/dashboard',
};

/**
 * Checks if a user has a specific role or one of multiple roles.
 */
export const hasRole = (userRole: string | undefined, roles: Role | Role[]): boolean => {
  if (!userRole) return false;
  if (Array.isArray(roles)) {
    return roles.includes(userRole as Role);
  }
  return userRole === roles;
};

/**
 * Helper to check if user is an admin or coordinador (common check)
 */
export const canManageSystem = (userRole: string | undefined): boolean => {
  return hasRole(userRole, [ROLES.ADMIN, ROLES.COORDINADOR]);
};
