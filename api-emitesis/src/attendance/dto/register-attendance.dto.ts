import { IsNumber, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RegisterAttendanceDto {
  @IsNumber()
  @IsNotEmpty()
  lat: number;

  @IsNumber()
  @IsNotEmpty()
  lng: number;

  @IsOptional()
  @IsString()
  checkInPhotoUrl?: string;   // RF-15: URL de foto de entrada

  @IsOptional()
  @IsString()
  checkOutPhotoUrl?: string;  // RF-15: URL de foto de salida
}
