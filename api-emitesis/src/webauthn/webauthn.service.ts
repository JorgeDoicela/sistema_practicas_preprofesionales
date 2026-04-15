import { Injectable, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import type { RegistrationResponseJSON, AuthenticationResponseJSON } from '@simplewebauthn/server';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WebauthnService {
  private readonly rpName = 'ISTPET Prácticas';

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  private get rpID(): string {
    return this.configService.get<string>('WEBAUTHN_RP_ID') || 'localhost';
  }

  private get origin(): string {
    return this.configService.get<string>('WEBAUTHN_ORIGIN') || 'http://localhost:3000';
  }

  /** RF-14: Generar opciones para registrar credencial biométrica */
  async generateRegistrationOptions(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const options = await generateRegistrationOptions({
      rpName: this.rpName,
      rpID: this.rpID,
      userName: user.email,
      userDisplayName: user.fullName,
      attestationType: 'none',
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred',
      },
      supportedAlgorithmIDs: [-7, -257],
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { webauthnChallenge: options.challenge },
    });

    return options;
  }

  /** RF-14: Verificar y almacenar la credencial biométrica */
  async verifyRegistration(userId: string, response: RegistrationResponseJSON) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.webauthnChallenge) {
      throw new BadRequestException('No hay un challenge activo para este usuario');
    }

    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response,
        expectedChallenge: user.webauthnChallenge,
        expectedOrigin: this.origin,
        expectedRPID: this.rpID,
        requireUserVerification: true,
      });
    } catch {
      throw new UnauthorizedException('La verificación biométrica falló');
    }

    if (!verification.verified || !verification.registrationInfo) {
      throw new UnauthorizedException('Registro biométrico no verificado');
    }

    const { credential } = verification.registrationInfo;
    // credential.id is Base64URLString, credential.publicKey is Uint8Array
    const publicKeyB64 = isoBase64URL.fromBuffer(Buffer.from(credential.publicKey));

    await this.prisma.userCredential.upsert({
      where: { userId },
      create: {
        userId,
        credentialId: credential.id,
        publicKey: publicKeyB64,
        counter: credential.counter,
      },
      update: {
        credentialId: credential.id,
        publicKey: publicKeyB64,
        counter: credential.counter,
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { webauthnChallenge: null },
    });

    return { verified: true };
  }

  /** RF-14: Generar opciones para autenticar con huella */
  async generateAuthenticationOptions(userId: string) {
    const storedCredential = await this.prisma.userCredential.findUnique({ where: { userId } });
    if (!storedCredential) {
      throw new NotFoundException('No tienes una huella registrada. Por favor regístrala primero.');
    }

    const options = await generateAuthenticationOptions({
      rpID: this.rpID,
      userVerification: 'required',
      allowCredentials: [
        {
          id: storedCredential.credentialId, // already Base64URLString
        },
      ],
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { webauthnChallenge: options.challenge },
    });

    return options;
  }

  /** RF-14: Verificar autenticación biométrica */
  async verifyAuthentication(userId: string, response: AuthenticationResponseJSON) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.webauthnChallenge) {
      throw new BadRequestException('No hay un challenge activo para este usuario');
    }

    const storedCredential = await this.prisma.userCredential.findUnique({ where: { userId } });
    if (!storedCredential) {
      throw new NotFoundException('No hay credencial biométrica registrada');
    }

    // publicKey se guardó como Base64URLString, reconvertir a Uint8Array
    const publicKeyBuffer = isoBase64URL.toBuffer(storedCredential.publicKey);

    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge: user.webauthnChallenge,
        expectedOrigin: this.origin,
        expectedRPID: this.rpID,
        requireUserVerification: true,
        credential: {
          id: storedCredential.credentialId, // Base64URLString
          publicKey: publicKeyBuffer,         // Uint8Array
          counter: storedCredential.counter,
        },
      });
    } catch {
      throw new UnauthorizedException('Verificación biométrica fallida');
    }

    if (!verification.verified) {
      throw new UnauthorizedException('Autenticación biométrica no verificada');
    }

    await this.prisma.userCredential.update({
      where: { userId },
      data: { counter: verification.authenticationInfo.newCounter },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { webauthnChallenge: null },
    });

    return { verified: true };
  }

  /** Verificar si el usuario ya tiene una credencial biométrica registrada */
  async getCredentialStatus(userId: string) {
    const credential = await this.prisma.userCredential.findUnique({ where: { userId } });
    return { registered: !!credential };
  }
}
