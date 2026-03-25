import { Role } from '@prisma/client';

export interface UserPayload {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
}
