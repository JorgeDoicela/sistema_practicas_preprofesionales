import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private prisma: PrismaService,
    private ai: AiService,
  ) {}

  async check() {
    const status = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: { status: 'down', message: '' },
        ai: { status: 'down', message: '' },
        storage: { status: 'ok', message: 'Vercel Blob / Local' },
      },
    };

    // Check Database
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      status.services.database.status = 'ok';
    } catch (e: any) {
      status.status = 'error';
      status.services.database.message = e.message;
      this.logger.error('HealthCheck: Database is down', e.stack);
    }

    // Check AI
    status.services.ai.status = this.ai.isAvailable ? 'ok' : 'unavailable';
    if (!this.ai.isAvailable) {
      status.services.ai.message = 'OPENAI_API_KEY no configurada o servicio caído';
    }

    return status;
  }
}
