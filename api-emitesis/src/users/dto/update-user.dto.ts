import { Role } from '@prisma/client';

export class UpdateUserDto {
  email?: string;
  password?: string;
  fullName?: string;
  role?: Role;
  isActive?: boolean;
}

