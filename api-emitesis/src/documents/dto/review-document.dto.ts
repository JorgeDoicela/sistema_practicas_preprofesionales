import { IsString, IsEnum, IsNotEmpty, ValidateIf, MaxLength, IsOptional, Allow } from 'class-validator';
import { DocumentStatus } from '@prisma/client';
import { StripControlChars } from '../../common/decorators/strip-control-chars.decorator';

export class ReviewDocumentDto {
  @IsEnum(['APROBADO_TUTOR', 'RECHAZADO_TUTOR', 'APROBADO_DEFINITIVO', 'RECHAZADO_COORDINADOR'])
  status: DocumentStatus;

  @IsOptional()
  @StripControlChars()
  @MaxLength(8000, { message: 'Las observaciones superan el tamaño máximo permitido' })
  @ValidateIf((o) => o.status === 'RECHAZADO_TUTOR' || o.status === 'RECHAZADO_COORDINADOR')
  @IsNotEmpty({ message: 'Las observaciones son obligatorias para rechazar el documento' })
  @IsString()
  observations?: string;

  /** JSON: { version: 1, items: [...] } con áreas resaltadas y comentarios (opcional) */
  @IsOptional()
  @Allow()
  annotations?: unknown;
}
