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
import { DocumentTemplatesModule } from './document-templates/document-templates.module';
import { SettingsModule } from './settings/settings.module';
import { ReportsModule } from './reports/reports.module';
import { PrivacyModule } from './privacy/privacy.module';
import { SystemLogsModule } from './system-logs/system-logs.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { AnalyticsModule } from './analytics/analytics.module';

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
    DocumentTemplatesModule,
    SettingsModule,
    ReportsModule,
    PrivacyModule,
    MaintenanceModule,
    AnnouncementsModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

