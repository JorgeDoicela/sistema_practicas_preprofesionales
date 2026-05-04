import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { put, del, list, PutBlobResult, PutCommandOptions } from '@vercel/blob';

@Injectable()
export class StorageService {
  private readonly token: string | undefined;
  private readonly isProduction: boolean;

  constructor(private configService: ConfigService) {
    const rawToken = this.configService.get<string>('BLOB_READ_WRITE_TOKEN');
    // Limpiar posibles comillas si el .env las incluyó por error
    this.token = rawToken?.replace(/['"]/g, '');
    
    // RF-BLOB: Usar Vercel Blob si el token está presente y es válido
    this.isProduction = !!this.token && this.token.startsWith('vercel_blob_rw_');
    
    const maskedToken = this.token ? `${this.token.substring(0, 15)}...` : 'NULO';
    console.log(`[StorageService] Inicializado. Token: ${maskedToken}. Modo Vercel Blob: ${this.isProduction ? 'ACTIVO' : 'DESACTIVADO (Modo Local)'}`);
  }

  async upload(path: string, file: string | Buffer | Blob | ReadableStream | ArrayBuffer, options?: Partial<PutCommandOptions>): Promise<PutBlobResult> {
    if (!this.isProduction) {
      console.warn(`[StorageService] ALERTA: Usando Modo Local (No persistente) para ${path}. Verifique BLOB_READ_WRITE_TOKEN.`);
      return { url: `/uploads/${path}`, downloadUrl: `/uploads/${path}`, pathname: path, contentType: '', contentDisposition: '', size: 0 } as PutBlobResult;
    }

    try {
      console.log(`[StorageService] Intentando subir a Vercel Blob: ${path}`);
      const result = await put(path, file, {
        access: 'public',
        token: this.token,
        ...options,
      });
      console.log(`[StorageService] Subida exitosa: ${result.url}`);
      return result;
    } catch (error: unknown) {
      console.error('[StorageService] ERROR CRÍTICO en Vercel Blob:', (error as Error).message);
      // Fallback a URL local para no romper el flujo, pero avisando del error
      return { url: `/uploads/${path}`, downloadUrl: `/uploads/${path}`, pathname: path, contentType: '', contentDisposition: '', size: 0 } as PutBlobResult;
    }
  }

  async delete(url: string) {
    if (!this.isProduction || !url.includes('public.blob.vercel-storage.com')) return;
    try {
      await del(url, { token: this.token });
    } catch (error: unknown) {
      console.error('[StorageService] Error al eliminar en Vercel:', (error as Error).message);
    }
  }

  async listFiles(): Promise<{ blobs: Array<{ pathname: string; url: string }> }> {
    if (!this.isProduction) return { blobs: [] };
    try {
      return await list({ token: this.token });
    } catch (error: unknown) {
      console.error('[StorageService] Error al listar en Vercel:', (error as Error).message);
      return { blobs: [] };
    }
  }
}
