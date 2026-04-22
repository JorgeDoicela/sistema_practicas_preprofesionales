import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsDateString,
  IsOptional,
  IsEmail,
  MaxLength,
  IsUUID,
  Min,
  Max,
} from 'class-validator';
import { StripControlChars, SanitizeEmailField } from '../../common/decorators/strip-control-chars.decorator';

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
  @IsNotEmpty()
  totalHours: number;

  @StripControlChars()
  @MaxLength(500)
  @IsString()
  @IsNotEmpty()
  location: string;

  @IsOptional()
  @StripControlChars()
  @MaxLength(200)
  @IsString()
  businessTutorName?: string;

  @IsOptional()
  @SanitizeEmailField()
  @MaxLength(254)
  @IsEmail({}, { message: 'Correo del tutor empresarial no válido' })
  businessTutorEmail?: string;

  @IsOptional()
  @StripControlChars()
  @MaxLength(30)
  @IsString()
  businessTutorPhone?: string;

  @IsOptional()
  @StripControlChars()
  @MaxLength(150)
  @IsString()
  businessTutorPosition?: string;

  @IsOptional()
  @StripControlChars()
  @MaxLength(1000)
  @IsString()
  activityDescription?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  modalidad?: string;

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
