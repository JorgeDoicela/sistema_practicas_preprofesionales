import { Controller, Get, Patch, Param, Body, UseGuards, Res, UseInterceptors, UploadedFile, Req, BadRequestException } from '@nestjs/common';
import type { Response } from 'express';

import { DocumentsService } from './documents.service';
import { UpdateDocumentDatesDto } from './dto/update-document-dates.dto';
import { ReviewDocumentDto } from './dto/review-document.dto';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { RolesGuard } from '../auth/strategies/roles.guard';
import { Roles } from '../auth/strategies/roles.decorator';
import { Role } from '@prisma/client';
import { join } from 'path';
import { createReadStream } from 'fs';
import { TwoFactorGuard } from '../auth/strategies/two-factor.guard';

@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Patch(':id/review')
  @Roles(Role.TUTOR)
  @UseGuards(TwoFactorGuard)
  review(
    @Param('id') id: string,
    @Body() reviewDto: ReviewDocumentDto,
    @Req() req: any,
  ) {
    return this.documentsService.reviewDocument(id, reviewDto, req.user.id);
  }

  @Patch(':id/coordinator-review')
  @Roles(Role.COORDINADOR)
  @UseGuards(TwoFactorGuard)
  coordinatorReview(
    @Param('id') id: string,
    @Body() reviewDto: ReviewDocumentDto,
    @Req() req: any,
  ) {
    return this.documentsService.reviewByCoordinator(id, reviewDto, req.user.id);
  }

  @Get('internship/:id')
  @Roles(Role.TUTOR, Role.COORDINADOR, Role.ADMIN, Role.ESTUDIANTE)
  findByInternship(@Param('id') id: string) {
    return this.documentsService.findByInternship(id);
  }

  @Patch(':id/dates')
  @Roles(Role.TUTOR, Role.ADMIN) // RF-DOC-001: Actor Tutor Académico
  @UseGuards(TwoFactorGuard)
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

  @Patch(':id/upload')
  @Roles(Role.ESTUDIANTE) // RF-DOC-003: Actor Estudiante
  @UseGuards(TwoFactorGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: (req, file, cb) => {
        // Regla de Negocio: Solo archivos PDF
        if (!file.originalname.match(/\.(pdf)$/)) {
          return cb(new BadRequestException('Solo se permiten archivos en formato PDF'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // Regla de Negocio: Máximo 10MB
      },
    }),
  )
  upload(
    @Param('id') id: string,
    @UploadedFile() file: any, // Usamos any aquí para evitar conflictos de tipos de Multer local/global
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('El archivo PDF es obligatorio');
    }
    return this.documentsService.uploadDocument(id, file, req.user.id);
  }
}
