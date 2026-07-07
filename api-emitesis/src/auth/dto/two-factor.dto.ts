import { IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TwoFactorCodeDto {
  @ApiProperty({
    description: 'Código TOTP de 6 dígitos generado por la aplicación de autenticación',
    example: '123456',
  })
  @IsString()
  @Length(6, 6, { message: 'El código debe tener exactamente 6 dígitos' })
  @Matches(/^\d{6}$/, { message: 'El código debe contener solo dígitos numéricos' })
  code: string;
}
