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

    const directories = ['documents', 'agreements', 'templates'];
    
    // Obtener todos los archivos referenciados en la BD
    const [docs, agreements] = await Promise.all([
      this.prisma.document.findMany({ select: { filePath: true } }),
      this.prisma.agreement.findMany({ select: { filePath: true } }),
    ]);

    const referencedFiles = new Set([
      ...docs.map(d => d.filePath).filter(Boolean),
      ...agreements.map(a => a.filePath).filter(Boolean),
    ]);

    for (const dir of directories) {
      const dirPath = path.join(this.uploadsPath, dir);
      if (!fs.existsSync(dirPath)) continue;

      const files = fs.readdirSync(dirPath);
      for (const file of files) {
        // En la BD el path suele guardarse como 'uploads/dir/file' o similar
        // Necesitamos normalizar para comparar
        const relativePath = `uploads/${dir}/${file}`;
        
        if (!referencedFiles.has(relativePath)) {
          const fullPath = path.join(dirPath, file);
          const stats = fs.statSync(fullPath);
          
          if (stats.isFile()) {
            totalSize += stats.size;
            fs.unlinkSync(fullPath);
            deletedCount++;
            this.logger.warn(`Archivo huerfano eliminado: ${relativePath}`);
          }
        }
      }
    }

    return {
      success: true,
      deletedCount,
      reclaimedBytes: totalSize,
      reclaimedMb: Number((totalSize / (1024 * 1024)).toFixed(2)),
    };
  }

  /**
   * Genera un volcado de la base de datos (Estructura para implementación futura)
   */
  async backupDatabase() {
    this.logger.log('Simulando backup de base de datos...');
    // Aquí se integraría la lógica para pg_dump o exportación a JSON de todas las tablas
    return {
      success: true,
      message: 'Backup solicitado. En entornos de producción Neon, use la consola para snapshots exactos.',
      timestamp: new Date().toISOString(),
    };
  }
}
