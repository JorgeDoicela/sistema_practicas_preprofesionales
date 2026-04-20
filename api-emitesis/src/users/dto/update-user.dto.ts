import { Role } from '@prisma/client';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
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

export class UpdateUserDto {
  @IsOptional()
  @SanitizeEmailField()
  @MaxLength(254)
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email?: string;

  @IsOptional()
  @SanitizePasswordField()
  @MaxLength(128)
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password?: string;

  @IsOptional()
  @StripControlChars()
  @MaxLength(200)
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsEnum(Role, { message: 'Rol no válido' })
  role?: Role;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null ? undefined : value))
  @IsUUID('4')
  companyId?: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null ? undefined : value))
  @IsUUID('4')
  careerId?: string;
}
