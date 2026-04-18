import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { RolesGuard } from '../auth/strategies/roles.guard';
import { Roles } from '../auth/strategies/roles.decorator';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';

@ApiTags('Announcements')
@Controller('announcements')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Crear un nuevo anuncio global (Solo ADMIN)' })
  create(@Body() createAnnouncementDto: CreateAnnouncementDto, @Req() req: any) {
    return this.announcementsService.create(createAnnouncementDto, req.user?.id);
  }

  @Get()
  @Roles(Role.ADMIN, Role.COORDINADOR)
  @ApiOperation({ summary: 'Listar todos los anuncios (ADMIN/COORD)' })
  findAll() {
    return this.announcementsService.findAll();
  }

  @Get('active')
  @ApiOperation({ summary: 'Obtener anuncios activos para el dashboard actual' })
  findActive() {
    return this.announcementsService.findActive();
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Actualizar un anuncio' })
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.announcementsService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Eliminar un anuncio' })
  remove(@Param('id') id: string) {
    return this.announcementsService.remove(id);
  }
}
