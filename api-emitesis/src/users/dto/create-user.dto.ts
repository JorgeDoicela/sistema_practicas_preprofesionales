import { Role } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import {
  SanitizeEmailField,
  SanitizePasswordField,
  StripControlChars,
} from '../../common/decorators/strip-control-chars.decorator';

export class CreateUserDto {
  @ApiProperty({ example: 'usuario@correo.com', description: 'Correo electrónico del usuario' })
  @SanitizeEmailField()
  @MaxLength(254)
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @IsNotEmpty({ message: 'El correo es requerido' })
  email: string;

  @ApiProperty({ example: 'password123', description: 'Contraseña de acceso' })
  @SanitizePasswordField()
  @MaxLength(128)
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @ApiProperty({ example: 'Juan Pérez', description: 'Nombre completo del usuario' })
  @StripControlChars()
  @MaxLength(200)
  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre completo es requerido' })
  fullName: string;

  @ApiProperty({ enum: Role, example: Role.ESTUDIANTE, description: 'Rol asignado al usuario' })
  @IsEnum(Role, { message: 'Rol no válido' })
  @IsNotEmpty({ message: 'El rol es requerido' })
  role: Role;

  @ApiProperty({ example: 'uuid-empresa', description: 'ID de la empresa asociada', required: false })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null ? undefined : value))
  @IsUUID('4', { message: 'companyId debe ser un UUID válido' })
  companyId?: string;

  @ApiProperty({ example: 'uuid-carrera', description: 'ID de la carrera asociada', required: false })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null ? undefined : value))
  @IsUUID('4', { message: 'careerId debe ser un UUID válido' })
  careerId?: string;

  @IsOptional()
  @StripControlChars()
  @Transform(({ value }) => (value === '' ? null : value))
  @MaxLength(10)
  @IsString()
  cedula?: string | null;

  @IsOptional()
  @StripControlChars()
  @Transform(({ value }) => (value === '' ? null : value))
  @MaxLength(20)
  @IsString()
  phone?: string | null;

  @IsOptional()
  @StripControlChars()
  @Transform(({ value }) => (value === '' ? null : value))
  @MaxLength(50)
  @IsString()
  ciclo?: string | null;
}
