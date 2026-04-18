import { IsNotEmpty, IsString, IsDateString, IsOptional, IsUUID, IsEnum } from 'class-validator';

export enum VisitType {
  PRESENCIAL = 'PRESENCIAL',
  VIRTUAL = 'VIRTUAL',
}

export class CreateVisitDto {
  @IsUUID('4')
  @IsNotEmpty()
  internshipId: string;

  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsEnum(VisitType)
  @IsNotEmpty()
  type: VisitType;

  @IsString()
  @IsNotEmpty()
  observations: string;

  @IsOptional()
  @IsString()
  evidenceUrl?: string;
}

export class UpdateVisitDto extends CreateVisitDto {}
