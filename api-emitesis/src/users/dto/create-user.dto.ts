import { Role } from '@prisma/client';

export class CreateUserDto {
  email: string;
  password: string;
  fullName: string;
  role: Role;
  companyId?: string;
}

