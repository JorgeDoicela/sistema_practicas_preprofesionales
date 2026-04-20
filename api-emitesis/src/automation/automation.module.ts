import { Module } from '@nestjs/common';
import { AutomationService } from './automation.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SystemLogsModule } from '../system-logs/system-logs.module';

@Module({
  imports: [PrismaModule, NotificationsModule, SystemLogsModule],
  providers: [AutomationService],
  exports: [AutomationService],
})
export class AutomationModule {}
