import { Controller, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { RolesGuard } from '../auth/strategies/roles.guard';
import { Roles } from '../auth/strategies/roles.decorator';
import { SettingsService } from './settings.service';
import { UpdateSettingDto } from './dto/update-setting.dto';

@ApiTags('Settings')
@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Listar todas las configuraciones del sistema' })
  findAll() {
    return this.settingsService.findAll();
  }

  @Get(':key')
  @Roles(Role.ADMIN, Role.COORDINADOR)
  @ApiOperation({ summary: 'Obtener una configuración específica por clave' })
  findOne(@Param('key') key: string) {
    return this.settingsService.findByKey(key);
  }

  @Patch(':key')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Actualizar un valor de configuración' })
  update(@Param('key') key: string, @Body() dto: UpdateSettingDto) {
    return this.settingsService.update(key, dto);
  }
}
