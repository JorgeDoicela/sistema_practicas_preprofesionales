import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class QuerySystemLogsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number = 50;

  @IsOptional()
  @IsString()
  @IsIn(['INFO', 'WARN', 'ERROR'])
  level?: string;

  @IsOptional()
  @IsString()
  @IsIn(['HTTP', 'AUTH', 'SYSTEM'])
  category?: string;
}
