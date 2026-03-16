import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { InternshipsService } from './internships.service';
import { CreateInternshipDto } from './dto/create-internship.dto';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { RolesGuard } from '../auth/strategies/roles.guard';
import { Roles } from '../auth/strategies/roles.decorator';
import { Role } from '@prisma/client';

@Controller('internships')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InternshipsController {
  constructor(private readonly internshipsService: InternshipsService) {}

  @Post()
  @Roles(Role.COORDINADOR, Role.ADMIN)
  create(@Body() createInternshipDto: CreateInternshipDto) {
    return this.internshipsService.create(createInternshipDto);
  }

  @Get()
  @Roles(Role.COORDINADOR, Role.ADMIN)
  findAll() {
    return this.internshipsService.findAll();
  }

  @Get('tutor/:id')
  @Roles(Role.TUTOR, Role.ADMIN)
  findByTutor(@Param('id') id: string) {
    return this.internshipsService.findByTutor(id);
  }

  @Get('student/:id')
  @Roles(Role.ESTUDIANTE, Role.ADMIN)
  findByStudent(@Param('id') id: string) {
    return this.internshipsService.findByStudent(id);
  }

  @Get(':id')
  @Roles(Role.COORDINADOR, Role.ADMIN, Role.TUTOR, Role.ESTUDIANTE)
  findOne(@Param('id') id: string) {
    return this.internshipsService.findOne(id);
  }
}
