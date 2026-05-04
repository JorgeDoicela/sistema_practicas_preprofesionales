import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TwoFactorAuthService } from './two-factor-auth.service';
import { TwoFactorAuthController } from './two-factor-auth.controller';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    ConfigModule,
    NotificationsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'secretKey',
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, JwtStrategy, TwoFactorAuthService],
  controllers: [AuthController, TwoFactorAuthController],
  exports: [AuthService, TwoFactorAuthService],
})
export class AuthModule {}

