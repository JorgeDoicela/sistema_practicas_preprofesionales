import { Role } from '@prisma/client';

declare global {
  namespace Express {
    interface User {
      id: string;
      userId: string;
      email: string;
      role: Role;
      fullName: string;
      careerId?: string | null;
      companyId?: string | null;
      sub?: string;
    }
  }
}

export {};
