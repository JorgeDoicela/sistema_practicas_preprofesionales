"use client";

import { useEffect, useState } from "react";
import { User as UserType } from "@/types/user";
import { Role, ROLES, hasRole, canManageSystem, ROLE_LABELS, normalizeApiRoleToAppRole } from "@/constants/roles";

export function useAuth() {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Error parsing user from localStorage:", error);
      }
    }
    setLoading(false);
  }, []);

  const checkRole = (roles: Role | Role[]) => hasRole(user?.role, roles);
  
  const isManager = () => canManageSystem(user?.role);
  
  const getRoleLabel = () => {
    if (!user?.role) return "Usuario";
    const r = normalizeApiRoleToAppRole(user.role);
    return ROLE_LABELS[r] || user.role;
  };

  return {
    user,
    loading,
    role: user?.role as Role | undefined,
    checkRole,
    isManager: isManager(),
    isAdmin: checkRole(ROLES.ADMIN),
    isCoordinador: checkRole(ROLES.COORDINADOR),
    isTutorAcademico: checkRole(ROLES.TUTOR_ACADEMICO),
    isTutorEmpresarial: checkRole(ROLES.TUTOR_EMPRESARIAL),
    isEstudiante: checkRole(ROLES.ESTUDIANTE),
    isEmpresa: checkRole(ROLES.EMPRESA),
    roleLabel: getRoleLabel(),
  };
}
