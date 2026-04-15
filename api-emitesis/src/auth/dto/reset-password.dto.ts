import { IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { SanitizePasswordField, StripControlChars } from '../../common/decorators/strip-control-chars.decorator';

export class ResetPasswordDto {
  @StripControlChars()
  @MaxLength(512)
  @IsNotEmpty({ message: 'El token es requerido' })
  token: string;

  @SanitizePasswordField()
  @MaxLength(128)
  @IsNotEmpty({ message: 'La nueva contraseña es requerida' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;
}
