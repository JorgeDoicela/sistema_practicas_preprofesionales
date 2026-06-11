import { Role } from '@prisma/client';

export interface UserPayload {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  companyId?: string | null;
  isActive: boolean;
  createdAt: Date;
}
