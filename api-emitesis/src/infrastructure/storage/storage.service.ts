import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StorageService {
  private readonly token: string | undefined;
  private readonly isProduction: boolean;

  constructor(private configService: ConfigService) {
    this.token = this.configService.get<string>('BLOB_READ_WRITE_TOKEN');
    this.isProduction = !!this.token && process.env.NODE_ENV === 'production';
  }

  async upload(path: string, file: any, options?: any) {
    if (!this.isProduction) {
      console.log(`[StorageService] Local Mode: Archivo listo para ${path}`);
      return { url: `/uploads/${path}` };
    }

    try {
      // Importación dinámica para evitar errores si la librería no está instalada
      const { put } = await import('@vercel/blob');
      const { url } = await put(path, file, {
        access: 'public',
        token: this.token,
        ...options,
      });
      return { url };
    } catch (error: any) {
      console.error('[StorageService] Error en Vercel Blob:', error.message);
      return { url: `/uploads/${path}` };
    }
  }

  async delete(url: string) {
    if (!this.isProduction || !url.includes('public.blob.vercel-storage.com')) return;
    try {
      const { del } = await import('@vercel/blob');
      await del(url, { token: this.token });
    } catch (error: any) {
      console.error('[StorageService] Error al eliminar en Vercel:', error.message);
    }
  }

  async listFiles(): Promise<{ blobs: Array<{ pathname: string; url: string }> }> {
    if (!this.isProduction) return { blobs: [] };
    try {
      const { list } = await import('@vercel/blob');
      return await list({ token: this.token }) as any;
    } catch (error) {
      return { blobs: [] };
    }
  }
}
