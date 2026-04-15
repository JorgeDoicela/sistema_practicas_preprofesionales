import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';
import { SanitizeEmailField, StripControlChars } from '../../common/decorators/strip-control-chars.decorator';

export class ForgotPasswordDto {
  @SanitizeEmailField()
  @MaxLength(254)
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @IsNotEmpty({ message: 'El correo electrónico es requerido' })
  email: string;

  @StripControlChars()
  @MaxLength(4096)
  @IsNotEmpty({ message: 'El token de reCAPTCHA es requerido' })
  recaptchaToken: string;
}
