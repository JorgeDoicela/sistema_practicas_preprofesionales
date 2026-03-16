import { IsEmail, IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

export class RegisterCompanyDto {
  // User fields
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @IsNotEmpty({ message: 'El correo electrónico es requerido' })
  email: string;

  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password: string;

  @IsNotEmpty({ message: 'El nombre completo es requerido' })
  @IsString()
  fullName: string;

  // Company fields
  @IsNotEmpty({ message: 'El RUC es requerido' })
  @Matches(/^[0-9]{13}$/, { message: 'El RUC debe tener 13 dígitos numéricos' })
  ruc: string;

  @IsNotEmpty({ message: 'El nombre de la empresa es requerido' })
  @IsString()
  companyName: string;

  @IsNotEmpty({ message: 'La dirección de la empresa es requerida' })
  @IsString()
  address: string;

  @IsNotEmpty({ message: 'El nombre del representante es requerido' })
  @IsString()
  representative: string;
}
