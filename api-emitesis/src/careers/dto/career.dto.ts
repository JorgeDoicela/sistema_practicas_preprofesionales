import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Modalidad } from '@prisma/client';

export class CreateCareerDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  faculty?: string;

  @IsOptional()
  @IsEnum(Modalidad)
  modalidad?: Modalidad;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2000)
  requiredHours?: number;
}

export class UpdateCareerDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  faculty?: string;

  @IsOptional()
  @IsEnum(Modalidad)
  modalidad?: Modalidad;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2000)
  requiredHours?: number;
}
