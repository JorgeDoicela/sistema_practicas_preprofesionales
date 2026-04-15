import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { DeadlineCheckerService } from './deadline-checker.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, NotificationsModule, AuthModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, DeadlineCheckerService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
