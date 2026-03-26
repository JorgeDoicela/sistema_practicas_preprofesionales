import { IsString, IsEnum, IsNotEmpty, ValidateIf } from 'class-validator';
import { DocumentStatus } from '@prisma/client';

export class ReviewDocumentDto {
  @IsEnum(['APROBADO_TUTOR', 'RECHAZADO_TUTOR', 'APROBADO_DEFINITIVO', 'RECHAZADO_COORDINADOR'])
  status: DocumentStatus;

  @ValidateIf(o => o.status === 'RECHAZADO_TUTOR' || o.status === 'RECHAZADO_COORDINADOR')
  @IsNotEmpty({ message: 'Las observaciones son obligatorias para rechazar el documento' })
  @IsString()
  observations: string;
}
