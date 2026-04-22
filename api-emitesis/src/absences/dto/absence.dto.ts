import { IsString, IsNotEmpty, IsDateString, IsOptional } from 'class-validator';

export class CreateAbsenceDto {
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsOptional()
  @IsString()
  type?: string;
}

export class ReviewAbsenceDto {
  @IsString()
  @IsNotEmpty()
  status: string; // APROBADA | RECHAZADA

  @IsOptional()
  @IsString()
  reviewNotes?: string;
}
