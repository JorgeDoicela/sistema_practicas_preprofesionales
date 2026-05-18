import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { SystemLogsService } from './system-logs.service';

function sanitizeObject(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  const sanitized: Record<string, any> = {};
  const sensitiveKeys = [
    'password', 
    'secret', 
    'token', 
    'refreshToken', 
    'twoFactorSecret', 
    'webauthnChallenge', 
    'passwordConfirmation', 
    'signatureKey'
  ];
  for (const key of Object.keys(obj)) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
      sanitized[key] = '[REDACTADO_LOPDP]';
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitized[key] = sanitizeObject(obj[key]);
    } else {
      sanitized[key] = obj[key];
    }
  }
  return sanitized;
}

function extractIp(req: Request): string | undefined {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string') return xff.split(',')[0]?.trim().slice(0, 64);
  if (Array.isArray(xff)) return xff[0]?.slice(0, 64);
  const ra = req.socket?.remoteAddress;
  return ra ? String(ra).slice(0, 64) : undefined;
}

function normalizePath(req: Request): string {
  const raw = req.originalUrl ?? req.url ?? '';
  return raw.split('?')[0] || '';
}

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  constructor(private readonly systemLogs: SystemLogsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    if (req.method === 'OPTIONS') {
      return next.handle();
    }

    const path = normalizePath(req);
    if (path.includes('/api/docs')) {
      return next.handle();
    }

    const started = Date.now();
    const user = req.user as { userId?: string; email?: string } | undefined;

    const write = (statusCode: number, level: 'INFO' | 'WARN' | 'ERROR') => {
      const durationMs = Date.now() - started;
      const msg = `${req.method} ${path} → ${statusCode} (${durationMs}ms)`;

      const metadata = {
        userAgent: req.headers['user-agent'] ?? null,
        acceptLanguage: req.headers['accept-language'] ?? null,
        query: req.query ? sanitizeObject(req.query) : null,
        body: req.method !== 'GET' && req.body ? sanitizeObject(req.body) : null,
      };

      void this.systemLogs.append({
        level,
        category: 'HTTP',
        message: msg,
        method: req.method,
        path,
        statusCode,
        userId: user?.userId ?? null,
        actorEmail: user?.email ?? null,
        ip: extractIp(req) ?? null,
        durationMs,
        metadata,
      });
    };

    return next.handle().pipe(
      tap({
        next: () => {
          const status = res.statusCode;
          const level: 'INFO' | 'WARN' = status >= 400 ? 'WARN' : 'INFO';
          write(status, level);
        },
        error: (err: unknown) => {
          const status = err instanceof HttpException ? err.getStatus() : 500;
          const level: 'ERROR' | 'WARN' = status >= 500 ? 'ERROR' : 'WARN';
          write(status, level);
        },
      }),
    );
  }
}
