import { IsNotEmpty, IsDateString } from 'class-validator';

export class UpdateDocumentDatesDto {
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  dueDate: string;
}
