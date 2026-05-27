import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import * as path from 'path';

export interface StorageUploadResult {
  url: string;
  pathname: string;
}

@Injectable()
export class StorageService {
  private readonly uploadDir: string;
  private readonly publicBaseUrl: string;

  constructor(private configService: ConfigService) {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.publicBaseUrl = (this.configService.get<string>('PUBLIC_APP_URL') || 'http://localhost:3005').replace(/\/$/, '');

    void this.ensureDir(this.uploadDir);
  }

  private async ensureDir(dir: string) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch {
      /* noop */
    }
  }

  async upload(filePath: string, data: string | Buffer, _options?: { contentType?: string }): Promise<StorageUploadResult> {
    const fullPath = path.join(this.uploadDir, filePath);
    await this.ensureDir(path.dirname(fullPath));

    const buffer = typeof data === 'string' ? Buffer.from(data) : data;
    await fs.writeFile(fullPath, buffer);

    console.log(`[StorageService] Archivo guardado localmente: uploads/${filePath}`);
    return {
      url: `${this.publicBaseUrl}/uploads/${filePath.replace(/\\/g, '/')}`,
      pathname: filePath,
    };
  }

  async delete(urlOrPath: string): Promise<void> {
    let relativePath: string;

    if (urlOrPath.startsWith('http')) {
      const uploadsIndex = urlOrPath.indexOf('/uploads/');
      if (uploadsIndex !== -1) {
        relativePath = urlOrPath.substring(uploadsIndex + '/uploads/'.length);
      } else {
        console.warn(`[StorageService] No se pudo determinar la ruta local de: ${urlOrPath}`);
        return;
      }
    } else {
      relativePath = urlOrPath;
    }

    const fullPath = path.join(this.uploadDir, relativePath);
    try {
      await fs.unlink(fullPath);
      console.log(`[StorageService] Archivo eliminado: uploads/${relativePath}`);
    } catch (err: unknown) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code !== 'ENOENT') {
        console.error(`[StorageService] Error al eliminar ${relativePath}:`, (err as Error).message);
      }
    }
  }

  async listFiles(): Promise<{ blobs: Array<{ pathname: string; url: string }> }> {
    const results: Array<{ pathname: string; url: string }> = [];

    const scanDir = async (dir: string, prefix: string) => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const entryPath = path.join(dir, entry.name);
          const entryPrefix = prefix ? `${prefix}/${entry.name}` : entry.name;
          if (entry.isDirectory()) {
            await scanDir(entryPath, entryPrefix);
          } else {
            results.push({
              pathname: entryPrefix,
              url: `${this.publicBaseUrl}/uploads/${entryPrefix}`,
            });
          }
        }
      } catch {
        /* directory does not exist */
      }
    };

    await scanDir(this.uploadDir, '');
    return { blobs: results };
  }
}