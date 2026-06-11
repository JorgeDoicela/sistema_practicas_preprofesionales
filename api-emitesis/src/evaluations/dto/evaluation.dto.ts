import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min, MaxLength, IsUUID } from 'class-validator';
import { StripControlChars } from '../../common/decorators/strip-control-chars.decorator';

export class CreateEvaluationDto {
  @IsUUID('4')
  @IsNotEmpty()
  internshipId: string;

  @IsNotEmpty()
  @IsString()
  type: 'EMPRESARIAL' | 'ACADEMICA';

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

  @IsOptional()
  @StripControlChars()
  @MaxLength(8000)
  @IsString()
  observations?: string;
}

export class UpdateEvaluationDto extends CreateEvaluationDto {}
