import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CareersService } from './careers.service';
import { CreateCareerDto, UpdateCareerDto } from './dto/career.dto';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { RolesGuard } from '../auth/strategies/roles.guard';
import { Roles } from '../auth/strategies/roles.decorator';
import { Role } from '@prisma/client';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Careers')
@Controller('careers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CareersController {
  constructor(private readonly careersService: CareersService) {}

  @Get()
  @Roles(Role.ADMIN, Role.COORDINADOR, Role.TUTOR, Role.ESTUDIANTE)
  findAll() {
    return this.careersService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.COORDINADOR)
  findOne(@Param('id') id: string) {
    return this.careersService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateCareerDto) {
    return this.careersService.create(dto);
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateCareerDto) {
    return this.careersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.careersService.remove(id);
  }
}
