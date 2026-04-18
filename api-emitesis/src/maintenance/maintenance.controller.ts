import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { RolesGuard } from '../auth/strategies/roles.guard';
import { Roles } from '../auth/strategies/roles.decorator';
import { MaintenanceService } from './maintenance.service';

@ApiTags('Maintenance')
@Controller('maintenance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Post('cleanup-orphaned-files')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Eliminar archivos en disco que no tienen referencia en BD' })
  cleanup() {
    return this.maintenanceService.cleanupOrphanedFiles();
  }

  @Post('backup-db')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Generar backup manual de la base de datos' })
  backup() {
    return this.maintenanceService.backupDatabase();
  }
}
