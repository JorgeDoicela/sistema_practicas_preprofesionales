import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { put, del, list } from '@vercel/blob';

@Injectable()
export class StorageService {
  private readonly token: string;
  private readonly isProduction: boolean;

  constructor(private configService: ConfigService) {
    this.token = this.configService.get<string>('BLOB_READ_WRITE_TOKEN');
    this.isProduction = !!this.token;
  }

  async upload(path: string, file: Buffer | ReadableStream | string, options?: any) {
    if (!this.isProduction) {
      console.log(`[StorageService] Dev Mode: Simulating upload to ${path}`);
      return { url: `/uploads/${path}` };
    }

    const { url } = await put(path, file, {
      access: 'public',
      token: this.token,
      ...options,
    });
    return { url };
  }

  async delete(url: string) {
    if (!this.isProduction) {
      console.log(`[StorageService] Dev Mode: Simulating delete of ${url}`);
      return;
    }
    await del(url, { token: this.token });
  }

  async listFiles() {
    if (!this.isProduction) return { blobs: [] };
    return list({ token: this.token });
  }
}
