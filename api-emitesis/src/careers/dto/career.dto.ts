import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max } from 'class-validator';

export class CreateCareerDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  faculty?: string;

  @IsOptional()
  @IsString()
  modalidad?: string;

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
  @IsString()
  modalidad?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2000)
  requiredHours?: number;
}
