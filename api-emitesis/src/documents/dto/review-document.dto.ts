import { IsString, IsEnum, IsNotEmpty, ValidateIf } from 'class-validator';
import { DocumentStatus } from '@prisma/client';

export class ReviewDocumentDto {
  @IsEnum(['APROBADO_TUTOR', 'RECHAZADO_TUTOR'])
  status: DocumentStatus;

  @ValidateIf(o => o.status === 'RECHAZADO_TUTOR')
  @IsNotEmpty({ message: 'Las observaciones son obligatorias para rechazar el documento' })
  @IsString()
  observations: string;
}
