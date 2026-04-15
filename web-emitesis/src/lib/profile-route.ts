import { ROLES, Role, normalizeApiRoleToAppRole } from "@/constants/roles";

/** Ruta de «Mi perfil» según el rol en la app (tras normalizar TUTOR → TUTOR_ACADEMICO). */
export function getProfilePathForRole(role: string | undefined): string {
  if (!role) return "/dashboard/perfil";
  const r = normalizeApiRoleToAppRole(role) as Role;
  if (r === ROLES.TUTOR_ACADEMICO) return "/tutor-academico/perfil";
  if (r === ROLES.EMPRESA || r === ROLES.TUTOR_EMPRESARIAL) return "/empresa/perfil";
  return "/dashboard/perfil";
}
