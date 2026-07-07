import { Injectable } from '@nestjs/common';
import { authenticator } from 'otplib';
import { toDataURL } from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TwoFactorAuthService {
  // window: 1 → acepta el código del intervalo anterior/siguiente (±30s de tolerancia)
  private readonly totp = authenticator.clone({ window: 1, step: 30 });

  constructor(private prisma: PrismaService) {}

  public async generateTwoFactorAuthenticationSecret(user: { userId: string; email: string }) {
    const secret = this.totp.generateSecret();
    const otpauthUrl = this.totp.keyuri(user.email, 'ISTPET_EMITESIS', secret);

    await this.prisma.user.update({
      where: { id: user.userId },
      data: { twoFactorSecret: secret },
    });

    return { secret, otpauthUrl };
  }

  public async pipeQrCodeStream(otpauthUrl: string) {
    return toDataURL(otpauthUrl);
  }

  public isTwoFactorAuthenticationCodeValid(token: string, secret: string): boolean {
    return this.totp.verify({ token, secret });
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
