import { Controller, Get, Patch, Post, Param, Body, UseGuards, Res, UseInterceptors, UploadedFile, Req, BadRequestException, ForbiddenException } from '@nestjs/common';
import type { Response } from 'express';

import { DocumentsService } from './documents.service';
import { UpdateDocumentDatesDto } from './dto/update-document-dates.dto';
import { ReviewDocumentDto } from './dto/review-document.dto';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { RolesGuard } from '../auth/strategies/roles.guard';
import { Roles } from '../auth/strategies/roles.decorator';
import { Role } from '@prisma/client';
import { join, resolve } from 'path';
import { createReadStream } from 'fs';
import { TwoFactorGuard } from '../auth/strategies/two-factor.guard';
import { SignatureService } from '../core/signature.service';
import { DocumentCommentsService } from './document-comments.service';
import { SettingsService } from '../settings/settings.service';

@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly signatureService: SignatureService,
    private readonly documentCommentsService: DocumentCommentsService,
    private readonly settingsService: SettingsService,
  ) {}

  @Post(':id/comments')
  @Roles(Role.TUTOR, Role.COORDINADOR, Role.ESTUDIANTE)
  addComment(@Param('id') id: string, @Body() body: { content: string }, @Req() req: any) {
    return this.documentCommentsService.create(id, req.user.id, req.user.role, body.content);
  }

  @Get(':id/comments')
  @Roles(Role.TUTOR, Role.COORDINADOR, Role.ESTUDIANTE)
  findComments(@Param('id') id: string, @Req() req: any) {
    return this.documentCommentsService.findByDocument(id, req.user.id, req.user.role);
  }

  @Patch(':id/sign')
  @Roles(Role.COORDINADOR)
  @UseGuards(TwoFactorGuard)
  signDocument(@Param('id') id: string, @Body() body: { reason: string }, @Req() req: any) {
    return this.signatureService.signDocument(id, req.user.id, body.reason, req.user.careerId);
  }

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
    return this.documentsService.reviewByCoordinator(id, reviewDto, req.user.id, req.user.careerId);
  }

  @Get('internship/:id')
  @Roles(Role.TUTOR, Role.COORDINADOR, Role.ESTUDIANTE)
  findByInternship(@Param('id') id: string, @Req() req: any) {
    return this.documentsService.findByInternship(id, req.user);
  }

  @Get(':id/versions')
  @Roles(Role.TUTOR, Role.COORDINADOR)
  findVersions(@Param('id') id: string) {
    return this.documentsService.getVersions(id);
  }

  @Patch(':id/dates')
  @Roles(Role.TUTOR, Role.COORDINADOR, Role.ADMIN) // RF-DOC-001: Actor Tutor Académico / Autoridad
  @UseGuards(TwoFactorGuard)
  updateDates(
    @Param('id') id: string,
    @Body() updateDocumentDatesDto: UpdateDocumentDatesDto,
    @Req() req: any,
  ) {
    return this.documentsService.updateDates(id, updateDocumentDatesDto, req.user);
  }

  @Get(':id/template')
  @Roles(Role.ESTUDIANTE, Role.COORDINADOR, Role.TUTOR)
  async downloadTemplate(@Param('id') id: string, @Res() res: Response) {
    const { fileName, url } = await this.documentsService.getTemplatePath(id);

    if (url) {
      return res.redirect(url);
    }

    const basePath = resolve(process.cwd(), 'uploads/templates');
    const targetPath = resolve(basePath, fileName);

    if (!targetPath.startsWith(basePath)) {
      throw new ForbiddenException('Intento de Path Traversal bloqueado.');
    }

    const file = createReadStream(targetPath);
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
      limits: {
        fileSize: 50 * 1024 * 1024, // Límite de seguridad máximo (validación real por settings en el handler)
      },
    }),
  )
  async upload(
    @Param('id') id: string,
    @UploadedFile() file: any,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('El archivo PDF es obligatorio');
    }

    // Leer configuración dinámica de la BD
    const maxSizeMb = await this.settingsService.getNumberValue('document_max_size_mb', 10);
    const allowedTypesRaw = await this.settingsService.getValue('allowed_file_types', 'pdf');
    const allowedExtensions = allowedTypesRaw.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);

    // Validar tamaño
    if (file.size > maxSizeMb * 1024 * 1024) {
      throw new BadRequestException(`El archivo supera el límite máximo permitido de ${maxSizeMb}MB.`);
    }

    // Validar extensión
    const ext = (file.originalname as string).split('.').pop()?.toLowerCase() ?? '';
    if (!allowedExtensions.includes(ext)) {
      throw new BadRequestException(
        `Tipo de archivo no permitido. Solo se aceptan: ${allowedExtensions.map((e) => `.${e}`).join(', ')}.`,
      );
    }

    return this.documentsService.uploadDocument(id, file, req.user.id);
  }

  @Patch(':id/delete-file')
  @Roles(Role.ESTUDIANTE, Role.COORDINADOR)
  @UseGuards(TwoFactorGuard)
  deleteFile(@Param('id') id: string, @Req() req: any) {
    return this.documentsService.deleteDocumentFile(id, req.user);
  }
}
