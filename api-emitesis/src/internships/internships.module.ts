import { Module } from '@nestjs/common';
import { InternshipsController } from './internships.controller';
import { InternshipsService } from './internships.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SystemLogsModule } from '../system-logs/system-logs.module';
import { EvaluationsModule } from '../evaluations/evaluations.module';

@Module({
  imports: [PrismaModule, NotificationsModule, SystemLogsModule, EvaluationsModule],
  controllers: [InternshipsController],
  providers: [InternshipsService],
  exports: [InternshipsService],
})
export class InternshipsModule {}


