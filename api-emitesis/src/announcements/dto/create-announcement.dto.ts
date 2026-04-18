import { IsString, IsOptional, IsBoolean, IsEnum, IsDateString } from 'class-validator';

export class CreateAnnouncementDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

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
