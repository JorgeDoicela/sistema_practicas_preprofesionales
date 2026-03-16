import { IsString, IsEmail, IsNotEmpty, Length } from 'class-validator';

export class CreateAgreementDto {
  // Datos de la Empresa
  @IsString()
  @IsNotEmpty()
  @Length(13, 13, { message: 'El RUC debe tener exactamente 13 dígitos' })
  ruc: string;

  @IsString()
  @IsNotEmpty()
  companyName: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  representative: string;

  @IsEmail({}, { message: 'Correo electrónico inválido' })
  @IsNotEmpty()
  email: string;

  // Datos del Convenio
  @IsString()
  @IsNotEmpty()
  startDate: string; // Recibido como string ISO de la fecha
}
