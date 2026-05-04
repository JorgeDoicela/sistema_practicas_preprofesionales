import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { RolesGuard } from '../auth/strategies/roles.guard';
import { Roles } from '../auth/strategies/roles.decorator';
import { DocumentTemplatesService } from './document-templates.service';
import { CreateDocumentTemplateDto } from './dto/create-document-template.dto';
import { UpdateDocumentTemplateDto } from './dto/update-document-template.dto';
import type { MulterFile } from '../shared/interfaces/multer-file.interface';

@ApiTags('Document templates')
@Controller('document-templates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentTemplatesController {
  constructor(private readonly documentTemplatesService: DocumentTemplatesService) {}

  @Get('blank-format-keys')
  @Roles(Role.COORDINADOR)
  async knownFormats() {
    const keys = await this.documentTemplatesService.resolveBlankFormatKeys();
    return {
      keys,
      protectedKeys: this.documentTemplatesService.institutionalBlankFormatKeys(),
    };
  }

  @Delete('blank-template')
  @Roles(Role.COORDINADOR)
  removeBlank(@Query('key') key?: string) {
    if (!key?.trim()) {
      throw new BadRequestException('Indique el parámetro key con el nombre del archivo .docx');
    }
    return this.documentTemplatesService.deleteBlankTemplate(key.trim());
  }

  @Post('upload-blank')
  @Roles(Role.COORDINADOR)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 20 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const ok =
          file.mimetype ===
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          file.originalname.toLowerCase().endsWith('.docx');
        if (!ok) {
          return cb(new BadRequestException('Solo se permiten archivos .docx'), false);
        }
        cb(null, true);
      },
    }),
  )
  uploadBlank(@UploadedFile() file: MulterFile) {
    if (!file) {
      throw new BadRequestException('Seleccione un archivo .docx');
    }
    return this.documentTemplatesService.uploadBlankTemplate(file);
  }

  @Get()
  @Roles(Role.COORDINADOR)
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.documentTemplatesService.findAllForAdmin(includeInactive === 'true');
  }

  @Post()
  @Roles(Role.COORDINADOR)
  create(@Body() dto: CreateDocumentTemplateDto) {
    return this.documentTemplatesService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.COORDINADOR)
  update(@Param('id') id: string, @Body() dto: UpdateDocumentTemplateDto) {
    return this.documentTemplatesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.COORDINADOR)
  remove(@Param('id') id: string) {
    return this.documentTemplatesService.remove(id);
  }
}
