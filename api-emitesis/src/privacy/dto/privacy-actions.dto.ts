import { IsString, IsBoolean, IsOptional, IsEnum } from 'class-validator';

export class PrivacyConsentDto {
    @IsBoolean()
    accepted: boolean;

    @IsString()
    version: string;
}

export class ArcoRequestDto {
    @IsEnum(['ACCESO', 'RECTIFICACION', 'CANCELACION', 'OPOSICION'])
    type: string;

    @IsString()
    @IsOptional()
    details?: string;
}
