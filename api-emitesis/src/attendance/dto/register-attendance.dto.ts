import { IsNumber, IsNotEmpty, IsOptional, IsString, MaxLength, Min, Max } from 'class-validator';

export class RegisterAttendanceDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  @IsNotEmpty()
  lat: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  @IsNotEmpty()
  lng: number;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  checkInPhotoUrl?: string;   // RF-15: URL de foto de entrada

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  checkOutPhotoUrl?: string;  // RF-15: URL de foto de salida
}
