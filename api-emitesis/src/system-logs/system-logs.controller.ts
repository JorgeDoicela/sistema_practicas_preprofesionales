import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { RolesGuard } from '../auth/strategies/roles.guard';
import { Roles } from '../auth/strategies/roles.decorator';
import { QuerySystemLogsDto } from './dto/query-system-logs.dto';
import { SystemLogsService } from './system-logs.service';

@ApiTags('System logs')
@ApiBearerAuth()
@Controller('system-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SystemLogsController {
  constructor(private readonly systemLogs: SystemLogsService) {}

  @Get()
  @Roles(Role.ADMIN)
  findAll(@Query() query: QuerySystemLogsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    return this.systemLogs.findPage({
      page,
      limit,
      level: query.level,
      category: query.category,
    });
  }
}
