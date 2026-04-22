import { IsString, IsEmail, IsNotEmpty, Length, IsOptional, IsInt, Min, Max } from 'class-validator';

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

  @IsOptional()
  @IsString()
  city?: string;

  @IsString()
  @IsNotEmpty()
  representative: string;

  @IsEmail({}, { message: 'Correo electrónico inválido' })
  @IsNotEmpty()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  sector?: string;

  // Datos del Convenio
  @IsString()
  @IsNotEmpty()
  startDate: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  maxInterns?: number;
}
