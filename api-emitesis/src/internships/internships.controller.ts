import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { InternshipsService } from './internships.service';
import { CreateInternshipDto } from './dto/create-internship.dto';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { RolesGuard } from '../auth/strategies/roles.guard';
import { Roles } from '../auth/strategies/roles.decorator';
import { Role } from '@prisma/client';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Internships')
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

  @Get('company/:id')
  @Roles(Role.EMPRESA, Role.TUTOR_EMPRESARIAL, Role.ADMIN, Role.COORDINADOR)
  findByCompany(@Param('id') id: string) {
    return this.internshipsService.findByCompany(id);
  }

  @Patch(':id/toggle-test')
  @Roles(Role.EMPRESA, Role.TUTOR_EMPRESARIAL, Role.ADMIN, Role.COORDINADOR)
  toggleTest(@Param('id') id: string) {
    return this.internshipsService.toggleTest(id);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.COORDINADOR, Role.TUTOR, Role.ESTUDIANTE)
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.internshipsService.findOne(id, req.user);
  }
}
