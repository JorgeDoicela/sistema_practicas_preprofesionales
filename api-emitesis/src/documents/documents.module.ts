import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { DeadlineCheckerService } from './deadline-checker.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthModule } from '../auth/auth.module';
import { SystemLogsModule } from '../system-logs/system-logs.module';
import { DocumentCommentsService } from './document-comments.service';

@Module({
  imports: [PrismaModule, NotificationsModule, AuthModule, SystemLogsModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, DeadlineCheckerService, DocumentCommentsService],
  exports: [DocumentsService, DocumentCommentsService],
})
export class DocumentsModule {}
