import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { EmailService } from './email.service';
import { NotificationsTask } from './notifications.task';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PrismaModule } from '../prisma/prisma.module';

import { NotificationsGateway } from './notifications.gateway';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule
  ],
  providers: [EmailService, NotificationsTask, NotificationsService, NotificationsGateway],
  controllers: [NotificationsController],
  exports: [EmailService, NotificationsService, NotificationsGateway],
})
export class NotificationsModule {}

