export type UserRole = 'ADMIN' | 'COORDINADOR' | 'TUTOR_ACADEMICO' | 'TUTOR_EMPRESARIAL' | 'ESTUDIANTE' | 'EMPRESA';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  companyId?: string | null;
  isTwoFactorEnabled?: boolean;
}

export interface UserCompanyProfile {
  id: string;
  name: string;
  ruc: string;
  address: string;
  email: string;
  representative: string;
}

/** Respuesta de GET /users/me */
export interface UserProfile extends User {
  isTwoFactorEnabled: boolean;
  company?: UserCompanyProfile | null;
}
