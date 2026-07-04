import { IsString, IsNotEmpty, IsInt, IsDateString, IsOptional, MaxLength, IsUUID, Min, Max, IsEnum } from 'class-validator';
import { StripControlChars } from '../../common/decorators/strip-control-chars.decorator';
import { Modalidad } from '@prisma/client';

export class CreateInternshipDto {
  @IsUUID('4', { message: 'studentId debe ser un UUID válido' })
  @IsNotEmpty()
  studentId: string;

  @IsUUID('4', { message: 'companyId debe ser un UUID válido' })
  @IsNotEmpty()
  companyId: string;

  @IsUUID('4', { message: 'tutorId debe ser un UUID válido' })
  @IsNotEmpty()
  tutorId: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsInt()
  @Min(1)
  @Max(2000)
  @IsOptional()
  totalHours?: number;

  @StripControlChars()
  @MaxLength(500)
  @IsString()
  @IsNotEmpty()
  location: string;

  @IsOptional()
  @StripControlChars()
  @MaxLength(1000)
  @IsString()
  activityDescription?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(Modalidad, { message: 'modalidad debe ser una modalidad válida (PRESENCIAL, SEMIPRESENCIAL, EN_LINEA, HIBRIDA)' })
  modalidad?: Modalidad;

  // RF-ATT-LOC: Coordenadas iniciales para geocerca
  @IsOptional()
  initialLat?: number;

  @IsOptional()
  initialLng?: number;

  @IsOptional()
  @Min(50)
  @Max(5000)
  initialRadius?: number;

  @IsOptional()
  allowedLocations?: { label: string; lat: number; lng: number; radiusM?: number }[];
}
