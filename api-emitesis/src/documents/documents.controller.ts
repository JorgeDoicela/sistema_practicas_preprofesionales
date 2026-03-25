import { Controller, Get, Patch, Param, Body, UseGuards, Res } from '@nestjs/common';
import type { Response } from 'express';

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
  async downloadTemplate(@Param('id') id: string, @Res() res: Response) {
    const { fileName, url } = await this.documentsService.getTemplatePath(id);

    if (url) {
      return res.redirect(url);
    }

    const file = createReadStream(join(process.cwd(), 'uploads/templates', fileName));
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    });
    file.pipe(res);
  }
}
