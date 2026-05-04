import { IsNotEmpty, IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateDocumentDatesDto {
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  dueDate: string;

  @IsOptional()
  @IsString()
  twoFactorCode?: string;
}
