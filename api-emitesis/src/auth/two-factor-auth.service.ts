import { Injectable, BadRequestException } from '@nestjs/common';
import * as otplib from 'otplib';
import { toDataURL } from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TwoFactorAuthService {
  constructor(private prisma: PrismaService) {}

  public async generateTwoFactorAuthenticationSecret(user: { userId: string; email: string }) {
    console.log(`[2FA Debug] Generando secreto para userId: ${user.userId}`);
    const secret = otplib.generateSecret();
    const otpauthUrl = otplib.generateURI({
        issuer: 'ISTPET_EMITESIS',
        label: user.email,
        secret: secret
    });

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
    
    // Usamos epochTolerance de 300 segundos (5 minutos) para eliminar cualquier duda sobre desincronización
    const result = otplib.verifySync({
      token,
      secret,
      epochTolerance: 300,
      period: 30,
      digits: 6,
      algorithm: 'sha1'
    });
    
    console.log(`[2FA Debug] Resultado: ${result.valid}`);
    return result.valid;
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
