import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MaintenanceService {
  private readonly logger = new Logger(MaintenanceService.name);
  private readonly uploadsPath = path.join(process.cwd(), 'uploads');

  constructor(private prisma: PrismaService) {}

  /** 
   * Limpia archivos que existen en el disco pero no tienen referencia en la base de datos.
   */
  async cleanupOrphanedFiles() {
    this.logger.log('Iniciando limpieza de archivos huérfanos...');
    let deletedCount = 0;
    let totalSize = 0;

    const directories = ['documents', 'agreements', 'templates', 'photos'];
    
    // Obtener todos los archivos referenciados en la BD de TODAS las tablas que manejan archivos
    const [
      docs, 
      versions, 
      agreements, 
      attendances1, 
      attendances2, 
      activityPhotos, 
      monitoring, 
      templates
    ] = await Promise.all([
      this.prisma.document.findMany({ select: { filePath: true }, where: { filePath: { not: null } } }),
      this.prisma.documentVersion.findMany({ select: { filePath: true } }),
      this.prisma.agreement.findMany({ select: { filePath: true } }),
      this.prisma.attendance.findMany({ select: { checkInPhoto: true }, where: { checkInPhoto: { not: null } } }),
      this.prisma.attendance.findMany({ select: { checkOutPhoto: true }, where: { checkOutPhoto: { not: null } } }),
      this.prisma.activityPhoto.findMany({ select: { photoUrl: true } }),
      this.prisma.monitoringVisit.findMany({ select: { evidenceUrl: true }, where: { evidenceUrl: { not: null } } }),
      this.prisma.documentTemplate.findMany({ select: { blankFileKey: true }, where: { blankFileKey: { not: null } } }),
    ]);

    const referencedFiles = new Set<string>();
    
    // Poblar el set con rutas normalizadas
    const addPath = (p: string | null) => {
      if (p) referencedFiles.add(p.replace(/\\/g, '/'));
    };

    docs.forEach(d => addPath(d.filePath));
    versions.forEach(v => addPath(v.filePath));
    agreements.forEach(a => addPath(a.filePath));
    attendances1.forEach(a => addPath(a.checkInPhoto));
    attendances2.forEach(a => addPath(a.checkOutPhoto));
    activityPhotos.forEach(p => addPath(p.photoUrl));
    monitoring.forEach(m => addPath(m.evidenceUrl));
    templates.forEach(t => addPath(t.blankFileKey));

    for (const dir of directories) {
      const dirPath = path.join(this.uploadsPath, dir);
      if (!fs.existsSync(dirPath)) continue;

      const files = this.getAllFiles(dirPath);
      for (const file of files) {
        // Excluir archivos de sistema de Git
        if (file.endsWith('.gitkeep')) continue;

        // Normalizar path para comparar con la BD
        // El path relativo suele empezar con 'uploads/'
        const relativePath = path.relative(process.cwd(), file).replace(/\\/g, '/');
        
        if (!referencedFiles.has(relativePath)) {
          const stats = fs.statSync(file);
          if (stats.isFile()) {
            totalSize += stats.size;
            fs.unlinkSync(file);
            deletedCount++;
            this.logger.warn(`Archivo huerfano eliminado: ${relativePath}`);
          }
        }
      }
    }

    return {
      deletedCount,
      reclaimedBytes: totalSize,
      reclaimedMb: Number((totalSize / (1024 * 1024)).toFixed(2)),
    };
  }

  /**
   * Helper para obtener archivos de forma recursiva (por si hay subdirectorios)
   */
  private getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
    const files = fs.readdirSync(dirPath);

    files.forEach((file) => {
      const fullPath = path.join(dirPath, file);
      if (fs.statSync(fullPath).isDirectory()) {
        arrayOfFiles = this.getAllFiles(fullPath, arrayOfFiles);
      } else {
        arrayOfFiles.push(fullPath);
      }
    });

    return arrayOfFiles;
  }

  /**
   * Genera un volcado de la base de datos (Estructura para implementación futura)
   */
  backupDatabase() {
    this.logger.log('Simulando backup de base de datos...');
    // Aquí se integraría la lógica para pg_dump o exportación a JSON de todas las tablas
    return {
      message: 'Backup solicitado. En entornos de producción Neon, use la consola para snapshots exactos.',
      timestamp: new Date().toISOString(),
    };
  }
}
