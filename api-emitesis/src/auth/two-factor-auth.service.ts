import { Injectable } from '@nestjs/common';
import { authenticator } from 'otplib';
import { toDataURL } from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TwoFactorAuthService {
  private readonly totp = authenticator.clone({ window: 10, step: 30 });

  constructor(private prisma: PrismaService) {}

  public async generateTwoFactorAuthenticationSecret(user: { userId: string; email: string }) {
    console.log(`[2FA Debug] Generando secreto para userId: ${user.userId}`);
    const secret = this.totp.generateSecret();
    const otpauthUrl = this.totp.keyuri(user.email, 'ISTPET_EMITESIS', secret);

    console.log(`[2FA Debug] Secreto generado: ${secret.substring(0, 4)}... URL: ${otpauthUrl.substring(0, 50)}...`);

    await this.prisma.user.update({
      where: { id: user.userId },
      data: { twoFactorSecret: secret },
    });

    return {
      secret,
      otpauthUrl,
    };
  }

  public async pipeQrCodeStream(otpauthUrl: string) {
    return toDataURL(otpauthUrl);
  }

  public isTwoFactorAuthenticationCodeValid(token: string, secret: string) {
    console.log(`[2FA Debug] Verificando token: ${token} con secreto: ${secret.substring(0, 4)}...`);

    const valid = this.totp.verify({ token, secret });

    console.log(`[2FA Debug] Resultado: ${valid}`);
    return valid;
  }

  public async enableTwoFactorAuthentication(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isTwoFactorEnabled: true },
    });
  }

  public async disableTwoFactorAuthentication(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isTwoFactorEnabled: false, twoFactorSecret: null },
    });
  }
}
