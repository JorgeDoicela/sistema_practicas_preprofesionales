import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from '../prisma/prisma.module';
import { HttpLoggingInterceptor } from './http-logging.interceptor';
import { SystemLogsController } from './system-logs.controller';
import { SystemLogsService } from './system-logs.service';

@Module({
  imports: [PrismaModule],
  controllers: [SystemLogsController],
  providers: [
    SystemLogsService,
    { provide: APP_INTERCEPTOR, useClass: HttpLoggingInterceptor },
  ],
  exports: [SystemLogsService],
})
export class SystemLogsModule {}
