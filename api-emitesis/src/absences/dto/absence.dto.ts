import { IsString, IsNotEmpty, IsDateString, IsOptional, IsIn } from 'class-validator';

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
  @IsIn(['APROBADA', 'RECHAZADA'])
  @IsNotEmpty()
  status: string; // APROBADA | RECHAZADA

  @IsOptional()
  @IsString()
  reviewNotes?: string;
}
