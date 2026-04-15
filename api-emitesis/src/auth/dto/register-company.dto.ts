import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
  MaxLength,
  Equals,
} from 'class-validator';
import {
  SanitizeEmailField,
  SanitizePasswordField,
  StripControlChars,
} from '../../common/decorators/strip-control-chars.decorator';

export class RegisterCompanyDto {
  // User fields
  @SanitizeEmailField()
  @MaxLength(254)
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @IsNotEmpty({ message: 'El correo electrónico es requerido' })
  email: string;

  @SanitizePasswordField()
  @MaxLength(128)
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password: string;

  @StripControlChars()
  @MaxLength(200)
  @IsNotEmpty({ message: 'El nombre completo es requerido' })
  @IsString()
  fullName: string;

  // Company fields
  @StripControlChars()
  @IsNotEmpty({ message: 'El RUC es requerido' })
  @Matches(/^[0-9]{13}$/, { message: 'El RUC debe tener 13 dígitos numéricos' })
  ruc: string;

  @StripControlChars()
  @MaxLength(300)
  @IsNotEmpty({ message: 'El nombre de la empresa es requerido' })
  @IsString()
  companyName: string;

  @StripControlChars()
  @MaxLength(500)
  @IsNotEmpty({ message: 'La dirección de la empresa es requerida' })
  @IsString()
  address: string;

  @StripControlChars()
  @MaxLength(200)
  @IsNotEmpty({ message: 'El nombre del representante es requerido' })
  @IsString()
  representative: string;

  @StripControlChars()
  @MaxLength(4096)
  @IsNotEmpty({ message: 'El token de reCAPTCHA es requerido' })
  recaptchaToken: string;

  /** Consentimiento informado para el tratamiento de datos (LOPDP Ecuador). */
  @IsBoolean({ message: 'Debe indicar si acepta el tratamiento de datos personales' })
  @Equals(true, {
    message: 'Debe aceptar el aviso de privacidad y el tratamiento de datos personales para registrarse',
  })
  acceptDataTreatment: boolean;
}
