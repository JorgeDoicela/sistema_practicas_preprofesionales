import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSettingDto {
  @ApiProperty({ description: 'Nuevo valor para la configuración' })
  @IsString()
  @IsNotEmpty({ message: 'El valor no puede estar vacío' })
  value: string;

  @ApiPropertyOptional({ description: 'Descripción opcional de la configuración' })
  @IsOptional()
  @IsString()
  description?: string;
}

