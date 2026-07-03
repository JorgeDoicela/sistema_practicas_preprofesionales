import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import * as zlib from 'zlib';

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

    const directories = ['documents', 'agreements', 'templates', 'photos', 'absences'];
    
    // Obtener todos los archivos referenciados en la BD de TODAS las tablas que manejan archivos
    const [
      docs, 
      versions, 
      agreements, 
      attendances1, 
      attendances2, 
      activityPhotos, 
      monitoring, 
      templates,
      absences
    ] = await Promise.all([
      this.prisma.document.findMany({ select: { filePath: true }, where: { filePath: { not: null } } }),
      this.prisma.documentVersion.findMany({ select: { filePath: true } }),
      this.prisma.agreement.findMany({ select: { filePath: true } }),
      this.prisma.attendance.findMany({ select: { checkInPhoto: true }, where: { checkInPhoto: { not: null } } }),
      this.prisma.attendance.findMany({ select: { checkOutPhoto: true }, where: { checkOutPhoto: { not: null } } }),
      this.prisma.activityPhoto.findMany({ select: { photoUrl: true } }),
      this.prisma.monitoringVisit.findMany({ select: { evidenceUrl: true }, where: { evidenceUrl: { not: null } } }),
      this.prisma.documentTemplate.findMany({ select: { blankFileKey: true }, where: { blankFileKey: { not: null } } }),
      this.prisma.absence.findMany({ select: { filePath: true }, where: { filePath: { not: null } } }),
    ]);

    const referencedFiles = new Set<string>();
    
    const normalizeDbPath = (p: string | null, isTemplate = false): string | null => {
      if (!p) return null;
      let clean = p.replace(/\\/g, '/').trim();
      
      const uploadsIndex = clean.indexOf('/uploads/');
      if (uploadsIndex !== -1) {
        clean = clean.substring(uploadsIndex + '/uploads/'.length);
      } else if (clean.startsWith('uploads/')) {
        clean = clean.substring('uploads/'.length);
      }
      
      if (isTemplate && !clean.startsWith('templates/')) {
        clean = `templates/${clean}`;
      }
      
      return clean;
    };

    // Poblar el set con rutas normalizadas
    const addPath = (p: string | null, isTemplate = false) => {
      const normalized = normalizeDbPath(p, isTemplate);
      if (normalized) referencedFiles.add(normalized);
    };

    docs.forEach(d => addPath(d.filePath));
    versions.forEach(v => addPath(v.filePath));
    agreements.forEach(a => addPath(a.filePath));
    attendances1.forEach(a => addPath(a.checkInPhoto));
    attendances2.forEach(a => addPath(a.checkOutPhoto));
    activityPhotos.forEach(p => addPath(p.photoUrl));
    monitoring.forEach(m => addPath(m.evidenceUrl));
    templates.forEach(t => addPath(t.blankFileKey, true));
    absences.forEach(a => addPath(a.filePath));

    for (const dir of directories) {
      const dirPath = path.join(this.uploadsPath, dir);
      if (!fs.existsSync(dirPath)) continue;

      const files = this.getAllFiles(dirPath);
      for (const file of files) {
        // Excluir archivos de sistema de Git
        if (file.endsWith('.gitkeep')) continue;

        // Normalizar path de disco relativo a la carpeta de uploads para comparar
        const relativePath = path.relative(this.uploadsPath, file).replace(/\\/g, '/');
        
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
      success: true,
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
   * Genera un volcado comprimido de la base de datos usando pg_dump.
   */
  async backupDatabase() {
    this.logger.log('Iniciando copia de seguridad de la base de datos...');
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      this.logger.error('DATABASE_URL no está definida.');
      throw new InternalServerErrorException('La variable de entorno DATABASE_URL no está definida.');
    }

    const backupsDir = path.join(this.uploadsPath, 'backups');
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup_emitesis_${timestamp}.sql.gz`;
    const filePath = path.join(backupsDir, filename);

    try {
      await new Promise<void>((resolve, reject) => {
        // Ejecutar pg_dump pasando la URL de conexión de forma directa
        const pgDump = spawn('pg_dump', [dbUrl], {
          env: { ...process.env },
        });

        const gzip = zlib.createGzip();
        const writeStream = fs.createWriteStream(filePath);

        pgDump.stdout.pipe(gzip).pipe(writeStream);

        let errorMsg = '';
        pgDump.stderr.on('data', (data) => {
          errorMsg += data.toString();
        });

        pgDump.on('error', (err) => {
          this.logger.error(`Error al ejecutar pg_dump: ${err.message}`);
          reject(err);
        });

        writeStream.on('finish', () => {
          pgDump.on('close', (code) => {
            if (code !== 0) {
              this.logger.error(`pg_dump falló con código ${code}: ${errorMsg}`);
              reject(new Error(errorMsg || `pg_dump exit code ${code}`));
            } else {
              resolve();
            }
          });
        });

        writeStream.on('error', (err) => {
          reject(err);
        });
      });

      this.logger.log(`Copia de seguridad guardada en: ${filePath}`);
      return {
        success: true,
        message: `Copia de seguridad generada con éxito en el servidor: ${filename}`,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      // Eliminar el archivo si quedó a medias
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch {}
      }

      this.logger.error(`Fallo al generar copia de seguridad: ${error.message}`);
      throw new InternalServerErrorException(
        `No se pudo generar la copia de seguridad. Asegúrese de que 'pg_dump' esté instalado en el sistema. Detalles: ${error.message}`,
      );
    }
  }
}
