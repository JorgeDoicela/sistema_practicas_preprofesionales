import { IsNotEmpty, MinLength, MaxLength, Matches } from 'class-validator';
import { SanitizePasswordField, StripControlChars } from '../../common/decorators/strip-control-chars.decorator';

export class ResetPasswordDto {
  @StripControlChars()
  @MaxLength(512)
  @IsNotEmpty({ message: 'El token es requerido' })
  token: string;

  @SanitizePasswordField()
  @MaxLength(128)
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
    message: 'La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial',
  })
  password: string;
}
