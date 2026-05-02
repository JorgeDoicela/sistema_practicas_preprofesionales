import { Injectable, PipeTransform, ArgumentMetadata } from '@nestjs/common';

/**
 * SanitizationPipe: Blindaje contra XSS (Cross-Site Scripting)
 * Limpia recursivamente cualquier entrada de tipo string para eliminar etiquetas HTML
 * maliciosas antes de que lleguen a la base de datos o lógica de negocio.
 */
@Injectable()
export class SanitizationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type !== 'body' || !value || typeof value !== 'object') {
      return value;
    }

    return this.sanitize(value);
  }

  private sanitize(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map((v) => this.sanitize(v));
    }

    if (obj !== null && typeof obj === 'object') {
      const sanitizedObj: any = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          sanitizedObj[key] = this.sanitize(obj[key]);
        }
      }
      return sanitizedObj;
    }

    if (typeof obj === 'string') {
      // Elimina etiquetas HTML y scripts
      return obj
        .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, '')
        .replace(/<[^>]*>?/gm, '')
        .trim();
    }

    return obj;
  }
}
