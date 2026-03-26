import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { EmailService } from './email.service';
import { NotificationsTask } from './notifications.task';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule
  ],
  providers: [EmailService, NotificationsTask],
  exports: [EmailService],
})
export class NotificationsModule {}

