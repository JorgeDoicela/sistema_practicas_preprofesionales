import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateEvaluationDto {
  @IsString()
  @IsNotEmpty()
  internshipId: string;

  @IsInt()
  @Min(1)
  @Max(5)
  punctuality: number;

  @IsInt()
  @Min(1)
  @Max(5)
  teamwork: number;

  @IsInt()
  @Min(1)
  @Max(5)
  technicalSkills: number;

  @IsInt()
  @Min(1)
  @Max(5)
  proactivity: number;

  @IsInt()
  @Min(1)
  @Max(5)
  attitude: number;

  @IsString()
  @IsOptional()
  observations?: string;
}

export class UpdateEvaluationDto extends CreateEvaluationDto {}
