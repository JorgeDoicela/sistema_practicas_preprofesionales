import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CompaniesModule } from './companies/companies.module';
import { AgreementsModule } from './agreements/agreements.module';
import { InternshipsModule } from './internships/internships.module';
import { DocumentsModule } from './documents/documents.module';
import { AttendanceModule } from './attendance/attendance.module';
import { CertificationModule } from './certification/certification.module';
import { NotificationsModule } from './notifications/notifications.module';
import { StorageModule } from './infrastructure/storage/storage.module';
import { WebauthnModule } from './webauthn/webauthn.module';
import { AiModule } from './ai/ai.module';
import { SystemLogsModule } from './system-logs/system-logs.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    CompaniesModule,
    AgreementsModule,
    InternshipsModule,
    DocumentsModule,
    AttendanceModule,
    CertificationModule,
    NotificationsModule,
    StorageModule,
    WebauthnModule,
    AiModule,
    SystemLogsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

