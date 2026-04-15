import { IsEmail, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  SanitizeEmailField,
  SanitizePasswordField,
  StripControlChars,
} from '../../common/decorators/strip-control-chars.decorator';

export class LoginDto {
  @ApiProperty({ example: 'admin@emitesis.com', description: 'Correo electrónico' })
  @SanitizeEmailField()
  @MaxLength(254, { message: 'El correo es demasiado largo' })
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @IsNotEmpty({ message: 'El correo electrónico es requerido' })
  email: string;

  @ApiProperty({ example: 'admin123', description: 'Contraseña de acceso' })
  @SanitizePasswordField()
  @MaxLength(128, { message: 'La contraseña es demasiado larga' })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @ApiProperty({ example: 'recaptcha-token-string', description: 'Token de verificación de Google reCAPTCHA' })
  @StripControlChars()
  @MaxLength(4096, { message: 'Token de reCAPTCHA inválido' })
  @IsNotEmpty({ message: 'El token de reCAPTCHA es requerido' })
  recaptchaToken: string;
}
