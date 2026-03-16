import { Controller, Get, Patch, Param, Body, UseGuards, Res, StreamableFile } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { UpdateDocumentDatesDto } from './dto/update-document-dates.dto';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { RolesGuard } from '../auth/strategies/roles.guard';
import { Roles } from '../auth/strategies/roles.decorator';
import { Role } from '@prisma/client';
import { join } from 'path';
import { createReadStream } from 'fs';

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

  @Get(':id/template')
  @Roles(Role.ESTUDIANTE, Role.ADMIN)
  async downloadTemplate(@Param('id') id: string) {
    const fileName = await this.documentsService.getTemplatePath(id);
    const file = createReadStream(join(process.cwd(), 'uploads/templates', fileName));
    return new StreamableFile(file, {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      disposition: `attachment; filename="${fileName}"`,
    });
  }
}
