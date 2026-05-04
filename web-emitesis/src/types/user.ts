export type UserRole = 'ADMIN' | 'COORDINADOR' | 'TUTOR' | 'ESTUDIANTE' | 'EMPRESA';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  companyId?: string | null;
  careerId?: string | null;
  isTwoFactorEnabled?: boolean;
  cedula?: string | null;
  phone?: string | null;
  ciclo?: string | null;
}

export interface UserCompanyProfile {
  id: string;
  name: string;
  ruc: string;
  address: string;
  city?: string;
  email: string;
  phone?: string;
  sector?: string;
  representative: string;
}

/** Respuesta de GET /users/me */
export interface UserProfile extends User {
  isTwoFactorEnabled: boolean;
  company?: UserCompanyProfile | null;
}
