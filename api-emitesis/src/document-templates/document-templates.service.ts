import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../infrastructure/storage/storage.service';
import { MulterFile } from '../shared/interfaces/multer-file.interface';
import { CreateDocumentTemplateDto } from './dto/create-document-template.dto';
import { UpdateDocumentTemplateDto } from './dto/update-document-template.dto';

@Injectable()
export class DocumentTemplatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

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

  private defaultBlankFormatKeys(): string[] {
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

  /** Plantillas .docx del sistema que no se deben borrar desde el coordinador */
  institutionalBlankFormatKeys(): string[] {
    return this.defaultBlankFormatKeys();
  }

  private assertBlankFormatFilename(key: string): string {
    const k = path.basename(key || '').trim().toLowerCase();
    if (!/^[a-z0-9_-]+\.docx$/.test(k)) {
      throw new BadRequestException('Nombre de archivo no válido');
    }
    return k;
  }

  /**
   * Lista de archivos .docx disponibles como formato en blanco: plantillas por defecto,
   * más los que existan en disco (uploads/templates) y en el almacenamiento local.
   */
  async resolveBlankFormatKeys(): Promise<string[]> {
    const set = new Set(this.defaultBlankFormatKeys());
    const diskDir = path.join(process.cwd(), 'uploads', 'templates');
    try {
      const names = await fs.readdir(diskDir);
      for (const n of names) {
        if (n.toLowerCase().endsWith('.docx')) set.add(n);
      }
    } catch {
      /* directorio ausente en algunos despliegues */
    }
    try {
      const listResult = await this.storageService.listFiles();
      for (const b of listResult.blobs ?? []) {
        const p = (b.pathname || '').replace(/\\/g, '/');
        if (!p.toLowerCase().endsWith('.docx')) continue;
        if (p.includes('/templates/') || p.startsWith('templates/')) {
          const base = path.basename(p);
          if (base) set.add(base);
        }
      }
    } catch {
      /* listado no disponible */
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }

  /** Normaliza el nombre a clave segura *.docx (minúsculas, sin espacios raros). */
  private toSafeDocxKey(original: string): string {
    const base = path.basename(original || '').trim().toLowerCase();
    if (!base.endsWith('.docx')) {
      throw new BadRequestException('Solo se permiten archivos .docx');
    }
    const stem = base.slice(0, -5);
    const slug = stem
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_-]/gi, '');
    if (!slug || slug.length > 90) {
      throw new BadRequestException('Nombre de archivo no válido o demasiado largo');
    }
    return `${slug}.docx`;
  }

  /**
   * Sube un .docx de formato en blanco para poder asignarlo a plantillas del catálogo.
   * Se guarda en uploads/templates y se registra en el almacenamiento local.
   */
  async uploadBlankTemplate(file: MulterFile): Promise<{ key: string }> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Archivo vacío o no recibido');
    }
    const max = 20 * 1024 * 1024;
    if (file.size > max) {
      throw new BadRequestException('El archivo supera el tamaño máximo (20 MB)');
    }
    const key = this.toSafeDocxKey(file.originalname);
    const contentType =
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    await this.storageService.upload(`templates/${key}`, file.buffer, {
      contentType,
    });

    return { key };
  }

  /**
   * Elimina un .docx de la carpeta de formatos (disco y/o Blob). No aplica a las plantillas institucionales.
   * No se elimina si alguna plantilla del catálogo sigue usando ese archivo como blankFileKey.
   */
  async deleteBlankTemplate(rawKey: string): Promise<{ ok: boolean }> {
    const key = this.assertBlankFormatFilename(rawKey);
    if (this.defaultBlankFormatKeys().includes(key)) {
      throw new BadRequestException(
        'No se pueden eliminar los formatos .docx institucionales predefinidos del sistema.',
      );
    }

    const inUse = await this.prisma.documentTemplate.count({
      where: { blankFileKey: key },
    });
    if (inUse > 0) {
      throw new ConflictException(
        `El formato «${key}» está asignado a ${inUse} plantilla(s). Asigne otro archivo o quítese la asignación antes de eliminarlo.`,
      );
    }

    const diskPath = path.join(process.cwd(), 'uploads', 'templates', key);
    try {
      await fs.unlink(diskPath);
    } catch {
      /* archivo ausente en disco */
    }

    await this.storageService.delete(`templates/${key}`);

    return { ok: true };
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
        careerId: dto.careerId || null,
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
        ...(dto.careerId !== undefined ? { careerId: dto.careerId || null } : {}),
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
