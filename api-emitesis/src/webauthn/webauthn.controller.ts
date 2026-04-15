import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { WebauthnService } from './webauthn.service';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { RolesGuard } from '../auth/strategies/roles.guard';
import { Roles } from '../auth/strategies/roles.decorator';
import { Role } from '@prisma/client';
import type { RegistrationResponseJSON, AuthenticationResponseJSON } from '@simplewebauthn/server';

@Controller('webauthn')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WebauthnController {
  constructor(private readonly webauthnService: WebauthnService) {}

  /** RF-14: Verificar si el usuario ya tiene biométrico registrado */
  @Get('credential-status')
  @Roles(Role.ESTUDIANTE, Role.ADMIN)
  getCredentialStatus(@Req() req: any) {
    return this.webauthnService.getCredentialStatus(req.user.id);
  }

  /** RF-14: Paso 1 del registro - obtener opciones */
  @Get('registration-options')
  @Roles(Role.ESTUDIANTE, Role.ADMIN)
  getRegistrationOptions(@Req() req: any) {
    return this.webauthnService.generateRegistrationOptions(req.user.id);
  }

  /** RF-14: Paso 2 del registro - verificar y guardar credencial */
  @Post('verify-registration')
  @Roles(Role.ESTUDIANTE, Role.ADMIN)
  verifyRegistration(@Req() req: any, @Body() body: RegistrationResponseJSON) {
    return this.webauthnService.verifyRegistration(req.user.id, body);
  }

  /** RF-14: Paso 1 de autenticación - obtener challenge */
  @Get('authentication-options')
  @Roles(Role.ESTUDIANTE, Role.ADMIN)
  getAuthenticationOptions(@Req() req: any) {
    return this.webauthnService.generateAuthenticationOptions(req.user.id);
  }

  /** RF-14: Paso 2 de autenticación - verificar huella */
  @Post('verify-authentication')
  @Roles(Role.ESTUDIANTE, Role.ADMIN)
  verifyAuthentication(@Req() req: any, @Body() body: AuthenticationResponseJSON) {
    return this.webauthnService.verifyAuthentication(req.user.id, body);
  }
}
