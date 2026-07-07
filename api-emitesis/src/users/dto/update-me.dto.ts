import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  SanitizePasswordField,
  StripControlChars,
} from '../../common/decorators/strip-control-chars.decorator';
import { Transform } from 'class-transformer';

/** DTO para que el usuario actualice su propio perfil (solo nombre y contraseña). */
export class UpdateMeDto {
  @IsOptional()
  @StripControlChars()
  @MaxLength(200, { message: 'El nombre no puede superar 200 caracteres' })
  @IsString({ message: 'El nombre debe ser texto' })
  fullName?: string;

  @IsOptional()
  @SanitizePasswordField()
  @Transform(({ value }) => (value === '' || value === null ? undefined : value))
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @MaxLength(128, { message: 'La contraseña no puede superar 128 caracteres' })
  password?: string;
}
