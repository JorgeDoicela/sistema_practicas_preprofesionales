import {
  Controller,
  Post,
  UseGuards,
  Req,
  Body,
  UnauthorizedException,
  Get,
} from '@nestjs/common';
import { TwoFactorAuthService } from './two-factor-auth.service';
import { JwtAuthGuard } from './strategies/jwt-auth.guard';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('auth/2fa')
export class TwoFactorAuthController {
  constructor(
    private readonly twoFactorAuthService: TwoFactorAuthService,
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('generate')
  @UseGuards(JwtAuthGuard)
  async generate(@Req() req: any) {
    const { otpauthUrl } = await this.twoFactorAuthService.generateTwoFactorAuthenticationSecret(req.user);
    const qrCodeDataURL = await this.twoFactorAuthService.pipeQrCodeStream(otpauthUrl);
    return { qrCodeDataURL };
  }

  @Post('turn-on')
  @UseGuards(JwtAuthGuard)
  async turnOn(@Req() req: any, @Body() { code }: { code: string }) {
    console.log(`[2FA Debug] Intento de activación para userId: ${req.user.userId}`);
    
    // Necesitamos el secret de la DB ya que no está en el token JWT
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    if (!user) {
      console.log(`[2FA Debug] Usuario no encontrado: ${req.user.userId}`);
      throw new UnauthorizedException('Usuario no encontrado');
    }

    if (!user.twoFactorSecret) {
      console.log(`[2FA Debug] El usuario no tiene un secreto generado`);
      throw new UnauthorizedException('Primero debes generar un código QR');
    }

    const isCodeValid = this.twoFactorAuthService.isTwoFactorAuthenticationCodeValid(
      code,
      user.twoFactorSecret,
    );

    if (!isCodeValid) {
      console.log(`[2FA Debug] Código inválido: ${code}`);
      throw new UnauthorizedException('Código de verificación inválido');
    }
    
    await this.twoFactorAuthService.enableTwoFactorAuthentication(req.user.userId);
    console.log(`[2FA Debug] 2FA activado con éxito para ${req.user.userId}`);
    return { message: '2FA activado con éxito' };
  }

  @Post('turn-off')
  @UseGuards(JwtAuthGuard)
  async turnOff(@Req() req: any, @Body() { code }: { code: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    if (!user || !user.twoFactorSecret) {
      throw new UnauthorizedException('2FA no está configurado');
    }

    const isCodeValid = this.twoFactorAuthService.isTwoFactorAuthenticationCodeValid(
      code,
      user.twoFactorSecret,
    );

    if (!isCodeValid) {
      throw new UnauthorizedException('Código de verificación inválido');
    }

    await this.twoFactorAuthService.disableTwoFactorAuthentication(req.user.userId);
    return { message: '2FA desactivado con éxito' };
  }

  @Post('authenticate')
  async authenticate(@Body() { userId, code }: { userId: string, code: string }) {
    return this.authService.authenticateWith2FA(userId, code);
  }
}
