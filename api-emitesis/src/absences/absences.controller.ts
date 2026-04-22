import {
  Controller, Get, Post, Patch, Body, Param, UseGuards, Req,
  UseInterceptors, UploadedFile, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { AbsencesService } from './absences.service';
import { CreateAbsenceDto, ReviewAbsenceDto } from './dto/absence.dto';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { RolesGuard } from '../auth/strategies/roles.guard';
import { Roles } from '../auth/strategies/roles.decorator';
import { Role } from '@prisma/client';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Absences')
@Controller('absences')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AbsencesController {
  constructor(private readonly absencesService: AbsencesService) {}

  @Post()
  @Roles(Role.ESTUDIANTE)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const p = process.env.VERCEL ? tmpdir() : './uploads/absences';
          if (!process.env.VERCEL && !existsSync(p)) mkdirSync(p, { recursive: true });
          cb(null, p);
        },
        filename: (req, file, cb) => {
          cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(pdf|jpg|jpeg|png)$/)) {
          return cb(new BadRequestException('Solo PDF, JPG o PNG'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  create(@Req() req: any, @Body() dto: CreateAbsenceDto, @UploadedFile() file?: any) {
    const filePath = file ? `/uploads/absences/${file.filename}` : undefined;
    return this.absencesService.create(req.user.sub, dto, filePath);
  }

  @Get('internship/:id')
  @Roles(Role.ESTUDIANTE, Role.TUTOR, Role.COORDINADOR, Role.ADMIN)
  findByInternship(@Param('id') id: string) {
    return this.absencesService.findByInternship(id);
  }

  @Get('pending/tutor')
  @Roles(Role.TUTOR)
  findPendingForTutor(@Req() req: any) {
    return this.absencesService.findPendingForTutor(req.user.sub);
  }

  @Get('all')
  @Roles(Role.COORDINADOR, Role.ADMIN)
  findAll() {
    return this.absencesService.findAllForCoordinator();
  }

  @Patch(':id/review')
  @Roles(Role.TUTOR, Role.COORDINADOR, Role.ADMIN)
  review(@Param('id') id: string, @Req() req: any, @Body() dto: ReviewAbsenceDto) {
    return this.absencesService.review(id, req.user.sub, dto);
  }
}
