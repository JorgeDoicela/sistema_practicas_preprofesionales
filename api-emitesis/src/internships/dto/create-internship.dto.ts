import { IsString, IsNotEmpty, IsInt, IsDateString } from 'class-validator';

export class CreateInternshipDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsString()
  @IsNotEmpty()
  companyId: string;

  @IsString()
  @IsNotEmpty()
  tutorId: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsInt()
  @IsNotEmpty()
  totalHours: number;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsString()
  businessTutorName?: string;

  @IsString()
  businessTutorEmail?: string;
}
