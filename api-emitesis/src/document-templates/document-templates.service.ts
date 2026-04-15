import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentTemplateDto } from './dto/create-document-template.dto';
import { UpdateDocumentTemplateDto } from './dto/update-document-template.dto';

@Injectable()
export class DocumentTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllForAdmin(includeInactive = false) {
    return this.prisma.documentTemplate.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async findActiveOrdered() {
    return this.prisma.documentTemplate.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  /** Claves de .docx conocidas en uploads/templates (referencia para el coordinador). */
  knownBlankFormatKeys(): string[] {
    return [
      'solicitud_practicas.docx',
      'plan_rotacion.docx',
      'informe_actividades.docx',
      'registro_asistencia.docx',
      'evaluacion_tutor.docx',
      'evaluacion_representante.docx',
      'informe_final.docx',
      'certificado_culminacion.docx',
    ];
  }

  private async assertActiveCatalogHasCertificateSlot(excludeTemplateId?: string) {
    const active = await this.prisma.documentTemplate.findMany({
      where: { isActive: true },
      select: { id: true, isCertificateSlot: true, name: true },
    });
    const relevant = excludeTemplateId
      ? active.filter((t) => t.id !== excludeTemplateId)
      : active;
    const certCount = relevant.filter((t) => t.isCertificateSlot).length;
    if (certCount !== 1) {
      throw new BadRequestException(
        'Debe existir exactamente una plantilla activa marcada como “Certificado / cierre” (ranura del certificado generado por el sistema).',
      );
    }
  }

  private async clearOtherCertificateSlots(exceptId: string) {
    await this.prisma.documentTemplate.updateMany({
      where: { isCertificateSlot: true, id: { not: exceptId } },
      data: { isCertificateSlot: false },
    });
  }

  async create(dto: CreateDocumentTemplateDto) {
    const isCertificateSlot = dto.isCertificateSlot ?? false;
    const isActive = dto.isActive ?? true;

    const row = await this.prisma.documentTemplate.create({
      data: {
        name: dto.name.trim(),
        sortOrder: dto.sortOrder ?? 0,
        isActive,
        isRequired: dto.isRequired ?? true,
        isCertificateSlot,
        blankFileKey: dto.blankFileKey?.trim() || null,
      },
    });

    if (isCertificateSlot) {
      await this.clearOtherCertificateSlots(row.id);
    }

    if (isActive) {
      await this.assertActiveCatalogHasCertificateSlot();
    }

    return row;
  }

  /** Solo valida el catálogo activo cuando hay al menos una plantilla activa. */
  private async assertActiveCatalogIfAny() {
    const n = await this.prisma.documentTemplate.count({ where: { isActive: true } });
    if (n > 0) {
      await this.assertActiveCatalogHasCertificateSlot();
    }
  }

  async update(id: string, dto: UpdateDocumentTemplateDto) {
    const existing = await this.prisma.documentTemplate.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Plantilla no encontrada');
    }

    const nextCert =
      dto.isCertificateSlot !== undefined ? dto.isCertificateSlot : existing.isCertificateSlot;
    const nextActive = dto.isActive !== undefined ? dto.isActive : existing.isActive;

    const row = await this.prisma.documentTemplate.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.isRequired !== undefined ? { isRequired: dto.isRequired } : {}),
        ...(dto.isCertificateSlot !== undefined
          ? { isCertificateSlot: dto.isCertificateSlot }
          : {}),
        ...(dto.blankFileKey !== undefined
          ? { blankFileKey: dto.blankFileKey?.trim() || null }
          : {}),
      },
    });

    if (nextCert) {
      await this.clearOtherCertificateSlots(id);
    }

    if (nextActive) {
      await this.assertActiveCatalogHasCertificateSlot();
    } else {
      await this.assertActiveCatalogIfAny();
    }

    return row;
  }

  async remove(id: string) {
    const existing = await this.prisma.documentTemplate.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Plantilla no encontrada');
    }
    if (existing.isCertificateSlot) {
      throw new BadRequestException(
        'No se elimina la ranura de certificado: desactívela o sustitúyala creando otra plantilla con “Certificado / cierre”.',
      );
    }

    const refs = await this.prisma.document.count({ where: { templateId: id } });
    if (refs > 0) {
      throw new ConflictException(
        `Hay ${refs} documento(s) de prácticas vinculados a esta plantilla. Desactívela en lugar de eliminarla.`,
      );
    }

    await this.prisma.documentTemplate.delete({ where: { id } });

    await this.assertActiveCatalogIfAny();

    return { ok: true };
  }
}
