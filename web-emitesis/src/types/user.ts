export type UserRole = 'ADMIN' | 'COORDINADOR' | 'TUTOR_ACADEMICO' | 'TUTOR_EMPRESARIAL' | 'ESTUDIANTE' | 'EMPRESA';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  companyId?: string | null;
}
