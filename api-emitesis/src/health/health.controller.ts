import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { HealthService } from './health.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('System')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Verificar estado de salud del sistema' })
  async getHealth() {
    return this.healthService.check();
  }
}
