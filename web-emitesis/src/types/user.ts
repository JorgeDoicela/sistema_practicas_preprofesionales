export type UserRole = 'ADMIN' | 'COORDINADOR' | 'TUTOR' | 'ESTUDIANTE' | 'EMPRESA';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  companyId?: string | null;
}
