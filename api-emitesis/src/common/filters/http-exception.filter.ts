import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpExceptionFilter');

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Error interno del servidor';

    const errorResponse = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: typeof message === 'string' ? message : (message as any).message || message,
      error: (message as any).error || (status >= 500 ? 'Internal Server Error' : 'Bad Request'),
    };

    // Auditoría industrial: Log avanzado
    const logInfo = {
      method: request.method,
      path: request.url,
      ip: request.ip,
      userId: (request as any).user?.id || 'ANONYMOUS',
      statusCode: status,
      errorMessage: errorResponse.message,
    };

    if (status >= 500) {
      this.logger.error(
        `Critical Failure: ${JSON.stringify(logInfo)}`,
        exception.stack,
      );
    } else {
      this.logger.warn(`API Warning: ${JSON.stringify(logInfo)}`);
    }

    response.status(status).json(errorResponse);
  }
}
