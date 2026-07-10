import {
  Controller,
  Post,
  UseGuards,
  Req,
  Body,
  UnauthorizedException,
  Get,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TwoFactorAuthService } from './two-factor-auth.service';
import { JwtAuthGuard } from './strategies/jwt-auth.guard';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { TwoFactorCodeDto } from './dto/two-factor.dto';
import { Throttle } from '@nestjs/throttler';

@ApiTags('2FA')
@Controller('auth/2fa')
export class TwoFactorAuthController {
  constructor(
    private readonly twoFactorAuthService: TwoFactorAuthService,
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('generate')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Genera un secreto TOTP y devuelve el QR en base64' })
  async generate(@Req() req: any) {
    const { otpauthUrl } = await this.twoFactorAuthService.generateTwoFactorAuthenticationSecret(req.user);
    const qrCodeDataURL = await this.twoFactorAuthService.pipeQrCodeStream(otpauthUrl);
    return { qrCodeDataURL };
  }

  @Post('turn-on')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Activa el 2FA tras verificar el código TOTP' })
  async turnOn(@Req() req: any, @Body() dto: TwoFactorCodeDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    if (!user.twoFactorSecret) {
      throw new UnauthorizedException('Primero debes generar un código QR para configurar el 2FA');
    }

    const isCodeValid = this.twoFactorAuthService.isTwoFactorAuthenticationCodeValid(
      dto.code,
      user.twoFactorSecret,
    );

    if (!isCodeValid) {
      throw new UnauthorizedException('Código de verificación inválido o expirado');
    }

    await this.twoFactorAuthService.enableTwoFactorAuthentication(req.user.userId);
    return { message: 'Autenticación de dos factores activada con éxito' };
  }

  @Post('turn-off')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Desactiva el 2FA tras verificar el código TOTP' })
  async turnOff(@Req() req: any, @Body() dto: TwoFactorCodeDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    if (!user.twoFactorSecret || !user.isTwoFactorEnabled) {
      throw new UnauthorizedException('El 2FA no está activo en esta cuenta');
    }

    const isCodeValid = this.twoFactorAuthService.isTwoFactorAuthenticationCodeValid(
      dto.code,
      user.twoFactorSecret,
    );

    if (!isCodeValid) {
      throw new UnauthorizedException('Código de verificación inválido o expirado');
    }

    await this.twoFactorAuthService.disableTwoFactorAuthentication(req.user.userId);
    return { message: 'Autenticación de dos factores desactivada con éxito' };
  }

  @Post('authenticate')
  @Throttle({ global: { limit: 5, ttl: 300000 } })
  @ApiOperation({ summary: 'Valida el código 2FA durante el inicio de sesión' })
  async authenticate(@Body() { userId, code }: { userId: string; code: string }) {
    return this.authService.authenticateWith2FA(userId, code);
  }
}
