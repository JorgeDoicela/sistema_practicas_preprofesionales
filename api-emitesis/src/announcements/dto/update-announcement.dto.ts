import { IsString, IsOptional, IsBoolean, IsEnum, IsDateString } from 'class-validator';

export class UpdateAnnouncementDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsEnum(['INFO', 'WARNING', 'SUCCESS', 'DANGER'])
  type?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
