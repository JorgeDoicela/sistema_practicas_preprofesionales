import { IsArray, ValidateNested, IsNumber, IsString, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class AllowedLocationDto {
  @IsString()
  label: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;

  /** Radio en metros (por defecto 200) */
  @IsOptional()
  @IsNumber()
  @Min(50)
  @Max(5000)
  radiusM?: number;
}

export class UpdateLocationsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AllowedLocationDto)
  locations: AllowedLocationDto[];
}
