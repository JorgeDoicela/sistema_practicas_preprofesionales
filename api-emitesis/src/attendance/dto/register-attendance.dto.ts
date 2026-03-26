import { IsNumber, IsNotEmpty } from 'class-validator';

export class RegisterAttendanceDto {
  @IsNumber()
  @IsNotEmpty()
  lat: number;

  @IsNumber()
  @IsNotEmpty()
  lng: number;
}
