import { ROLES, Role, normalizeApiRoleToAppRole } from "@/constants/roles";

/** Ruta de «Mi perfil» según el rol en la app. */
export function getProfilePathForRole(role: string | undefined): string {
  if (!role) return "/dashboard/perfil";
  const r = normalizeApiRoleToAppRole(role) as Role;
  if (r === ROLES.TUTOR) return "/tutor-academico/perfil";
  if (r === ROLES.EMPRESA) return "/empresa/perfil";
  return "/dashboard/perfil";
}
