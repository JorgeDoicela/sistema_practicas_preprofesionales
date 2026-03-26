import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { put, del, list, PutBlobResult, PutCommandOptions } from '@vercel/blob';

@Injectable()
export class StorageService {
  private readonly token: string | undefined;
  private readonly isProduction: boolean;

  constructor(private configService: ConfigService) {
    this.token = this.configService.get<string>('BLOB_READ_WRITE_TOKEN');
    this.isProduction = !!this.token && process.env.NODE_ENV === 'production';
  }

  async upload(path: string, file: any, options?: Partial<PutCommandOptions>): Promise<PutBlobResult> {
    if (!this.isProduction) {
      console.log(`[StorageService] Local Mode: Archivo listo para ${path}`);
      return { url: `/uploads/${path}`, downloadUrl: `/uploads/${path}`, pathname: path, contentType: '', contentDisposition: '', size: 0 } as PutBlobResult;
    }

    try {
      return await put(path, file, {
        access: 'public',
        token: this.token,
        ...options,
      });
    } catch (error: any) {
      console.error('[StorageService] Error en Vercel Blob:', (error).message);
      return { url: `/uploads/${path}`, downloadUrl: `/uploads/${path}`, pathname: path, contentType: '', contentDisposition: '', size: 0 } as PutBlobResult;
    }
  }

  async delete(url: string) {
    if (!this.isProduction || !url.includes('public.blob.vercel-storage.com')) return;
    try {
      await del(url, { token: this.token });
    } catch (error: any) {
      console.error('[StorageService] Error al eliminar en Vercel:', (error).message);
    }
  }

  async listFiles(): Promise<{ blobs: Array<{ pathname: string; url: string }> }> {
    if (!this.isProduction) return { blobs: [] };
    try {
      return await list({ token: this.token });
    } catch (error: any) {
      console.error('[StorageService] Error al listar en Vercel:', (error).message);
      return { blobs: [] };
    }
  }
}
