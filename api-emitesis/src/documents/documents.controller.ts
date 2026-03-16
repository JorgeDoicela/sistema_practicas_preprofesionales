import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { UpdateDocumentDatesDto } from './dto/update-document-dates.dto';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { RolesGuard } from '../auth/strategies/roles.guard';
import { Roles } from '../auth/strategies/roles.decorator';
import { Role } from '@prisma/client';

@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get('internship/:id')
  @Roles(Role.TUTOR, Role.COORDINADOR, Role.ADMIN, Role.ESTUDIANTE)
  findByInternship(@Param('id') id: string) {
    return this.documentsService.findByInternship(id);
  }

  @Patch(':id/dates')
  @Roles(Role.TUTOR, Role.ADMIN) // RF-DOC-001: Actor Tutor Académico
  updateDates(
    @Param('id') id: string,
    @Body() updateDocumentDatesDto: UpdateDocumentDatesDto,
  ) {
    return this.documentsService.updateDates(id, updateDocumentDatesDto);
  }
}
