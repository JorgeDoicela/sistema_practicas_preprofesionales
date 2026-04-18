import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => {
        // Si la respuesta ya tiene éxito (por ejemplo, manual), la respetamos
        if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
          return data;
        }
        
        return {
          success: true,
          data: data || null,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
