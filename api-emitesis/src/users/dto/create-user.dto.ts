import { Role } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'usuario@correo.com', description: 'Correo electrónico del usuario' })
  email: string;

  @ApiProperty({ example: 'password123', description: 'Contraseña de acceso' })
  password: string;

  @ApiProperty({ example: 'Juan Pérez', description: 'Nombre completo del usuario' })
  fullName: string;

  @ApiProperty({ enum: Role, example: Role.ESTUDIANTE, description: 'Rol asignado al usuario' })
  role: Role;

  @ApiProperty({ example: 'uuid-empresa', description: 'ID de la empresa asociada', required: false })
  companyId?: string;
}

