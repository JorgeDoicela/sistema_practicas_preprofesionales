import { IsString, IsNotEmpty, IsInt, IsDateString, IsOptional } from 'class-validator';

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
}
