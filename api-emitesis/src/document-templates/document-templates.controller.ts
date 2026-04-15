import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { RolesGuard } from '../auth/strategies/roles.guard';
import { Roles } from '../auth/strategies/roles.decorator';
import { DocumentTemplatesService } from './document-templates.service';
import { CreateDocumentTemplateDto } from './dto/create-document-template.dto';
import { UpdateDocumentTemplateDto } from './dto/update-document-template.dto';

@ApiTags('Document templates')
@Controller('document-templates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentTemplatesController {
  constructor(private readonly documentTemplatesService: DocumentTemplatesService) {}

  @Get('blank-format-keys')
  @Roles(Role.COORDINADOR, Role.ADMIN)
  knownFormats() {
    return { keys: this.documentTemplatesService.knownBlankFormatKeys() };
  }

  @Get()
  @Roles(Role.COORDINADOR, Role.ADMIN)
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.documentTemplatesService.findAllForAdmin(includeInactive === 'true');
  }

  @Post()
  @Roles(Role.COORDINADOR, Role.ADMIN)
  create(@Body() dto: CreateDocumentTemplateDto) {
    return this.documentTemplatesService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.COORDINADOR, Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateDocumentTemplateDto) {
    return this.documentTemplatesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.COORDINADOR, Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.documentTemplatesService.remove(id);
  }
}
