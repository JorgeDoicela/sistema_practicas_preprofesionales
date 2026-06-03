import { Injectable, UnauthorizedException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../notifications/email.service';
import { TwoFactorAuthService } from './two-factor-auth.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RegisterCompanyDto } from './dto/register-company.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import axios from 'axios';
import { UserPayload } from './interfaces/user-payload.interface';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
    private twoFactorAuthService: TwoFactorAuthService,
  ) {}

  private async verifyRecaptcha(token: string) {
    const secretKey = this.configService.get<string>('RECAPTCHA_SECRET_KEY');
    const skipRecaptcha = this.configService.get<string>('SKIP_RECAPTCHA') === 'true';

    // Bypass por token especial de desarrollo/resiliencia o configuración explícita
    if (skipRecaptcha || token === 'dev_bypass') {
      console.warn('--- RECAPTCHA BYPASS: Bypass activo (skipRecaptcha o dev_bypass). Saltando validación. ---');
      return true;
    }
    
    // Si no hay clave configurada o es el placeholder inicial
    if (!secretKey || secretKey === 'PONER_AQUI_TU_CLAVE_SECRETA_DE_GOOGLE') {
      console.warn('reCAPTCHA Secret Key no configurada o incompleta. Use SKIP_RECAPTCHA=true para bypass local.');
      return true;
    }

    try {
      // Usamos URLSearchParams para asegurar el formato application/x-www-form-urlencoded
      const params = new URLSearchParams();
      params.append('secret', secretKey);
      params.append('response', token);

      const response = await axios.post<{ success: boolean; score?: number; action?: string; 'error-codes'?: string[] }>(
        'https://www.google.com/recaptcha/api/siteverify',
        params.toString(),
        {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }
      );
      
      if (!response.data.success) {
          console.warn('--- FALLO DE RECAPTCHA v3 (TOLERADO) ---');
          console.warn('Causas indicadas por Google:', response.data['error-codes']?.join(', ') || 'Desconocido');
          console.warn('Bypass tolerado por tratarse de entorno de sustentación/tesis.');
          return true;
      }

      // Validación de Score (0.0 - 1.0). 0.5 es un umbral estándar.
      const score = response.data.score ?? 0;
      console.log(`[reCAPTCHA v3] Score: ${score} | Action: ${response.data.action}`);

      if (score < 0.5) {
          console.warn(`--- BLOQUEO POR SCORE BAJO (${score}) (TOLERADO) ---`);
          console.warn('Bypass tolerado por tratarse de entorno de sustentación/tesis.');
          return true;
      }

      return true;
    } catch (error: unknown) {
      console.warn('Error de red al verificar reCAPTCHA (TOLERADO):', (error as Error).message);
      return true;
    }
  }

  async validateUser(loginDto: LoginDto) {
    const { email, password, recaptchaToken } = loginDto;

    // Verificar reCAPTCHA
    const isRecaptchaValid = await this.verifyRecaptcha(recaptchaToken);
    if (!isRecaptchaValid) {
      throw new BadRequestException('Validación de reCAPTCHA fallida');
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    if (!user.isActive) {
      throw new ForbiddenException('La cuenta está deshabilitada');
    }

    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      throw new ForbiddenException(
        'La cuenta está bloqueada temporalmente debido a demasiados intentos fallidos. Intente más tarde.',
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      const newFailedAttempts = user.failedAttempts + 1;
      const updateData: Prisma.UserUpdateInput = { failedAttempts: newFailedAttempts };

      if (newFailedAttempts >= 5) {
        // Bloquear por 15 minutos
        updateData.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000);
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      throw new UnauthorizedException('Credenciales incorrectas');
    }

    // Reiniciar intentos fallidos tras éxito
    if (user.failedAttempts > 0) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedAttempts: 0, lockoutUntil: null },
      });
    }

     
    const { password: _, ...result } = user;
    
    // Si tiene 2FA activado, no devolvemos el token todavía
    if (user.isTwoFactorEnabled) {
      return {
        mfaRequired: true,
        userId: user.id,
      };
    }

    return result;
  }

  async registerCompany(dto: RegisterCompanyDto) {
    console.log('--- BACKEND DEBUG: registerCompany iniciado ---');
    console.log('DTO recibido:', JSON.stringify(dto));
    const {
      email,
      password,
      fullName,
      ruc,
      companyName,
      address,
      representative,
      recaptchaToken,
    } = dto;

    // Verificar reCAPTCHA
    console.log('Iniciando registro para:', email);
    const isRecaptchaValid = await this.verifyRecaptcha(recaptchaToken);
    if (!isRecaptchaValid) {
      console.error('Fallo de reCAPTCHA para registro');
      throw new BadRequestException('Validación de reCAPTCHA fallida');
    }

    console.log('Buscando usuario existente...');

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('El correo electrónico ya está registrado');
    }

    // Check if company already exists by RUC
    const existingCompany = await this.prisma.company.findUnique({
      where: { ruc },
    });

    if (existingCompany) {
      throw new ConflictException('El RUC ya está registrado en el sistema');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create Company first
    const company = await this.prisma.company.create({
      data: {
        ruc,
        name: companyName,
        address,
        representative,
        email, // Using the same email for company contact by default
      },
    });

    // Create User linked to the Company
    console.log('Creando usuario vinculado a empresa...');
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        role: 'EMPRESA',
        companyId: company.id,
      },
    });

    console.log('Registro completado con éxito');
    
    // Enviar email de bienvenida
    try {
      console.log('Intentando enviar email a:', user.email);
      const emailRes = await this.emailService.sendWelcomeEmail(user.email, user.fullName);
      if (emailRes.success) {
        console.log('Email enviado correctamente');
      } else {
        console.error('El servicio de email devolvió error:', (emailRes as { error: string }).error);
      }
    } catch (emailError: unknown) {
      console.error('Error fatal disparando el envío de email:', (emailError as Error).message);
    }

    return this.login(user);
  }

  async getTokens(user: any) {
    const payload = { 
      email: user.email, 
      sub: user.id, 
      role: user.role,
      fullName: user.fullName,
      careerId: (user).careerId ?? null,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '1h',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'refreshSecretKey',
        expiresIn: '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashedRefreshToken },
    });
  }

  async login(user: any) {
    const tokens = await this.getTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        careerId: (user).careerId ?? null,
        cedula: (user).cedula ?? null,
        isTwoFactorEnabled: (user).isTwoFactorEnabled || false,
        lopdpAccepted: (user).lopdpAccepted || false,
      }
    };
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.refreshToken) {
      throw new ForbiddenException('Acceso denegado');
    }

    const refreshTokenMatches = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!refreshTokenMatches) {
      throw new ForbiddenException('Token de refresco inválido');
    }

    const tokens = await this.getTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        careerId: user.careerId ?? null,
        cedula: user.cedula ?? null,
        isTwoFactorEnabled: user.isTwoFactorEnabled || false,
        lopdpAccepted: user.lopdpAccepted || false,
      }
    };
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
    return { message: 'Sesión cerrada correctamente' };
  }


  async forgotPassword(dto: ForgotPasswordDto) {
    const { email, recaptchaToken } = dto;

    // Verificar reCAPTCHA
    const isRecaptchaValid = await this.verifyRecaptcha(recaptchaToken);
    if (!isRecaptchaValid) {
      throw new BadRequestException('Validación de reCAPTCHA fallida');
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Por seguridad, no revelamos si el usuario existe o no
      return { message: 'Si el correo está registrado, recibirás un enlace de recuperación.' };
    }

    // Generar token único de 32 bytes
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // Expiración en 1 hora

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetTokenExpires: expires,
      },
    });

    // Enviar email
    await this.emailService.sendPasswordResetEmail(user.email, user.fullName, token);

    return { message: 'Si el correo está registrado, recibirás un enlace de recuperación.' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const { token, password } = dto;

    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new BadRequestException('El enlace de recuperación es inválido o ha expirado');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpires: null,
        failedAttempts: 0,
        lockoutUntil: null,
      },
    });

    return { message: 'Contraseña restablecida correctamente' };
  }

  async authenticateWith2FA(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.twoFactorSecret) {
      throw new UnauthorizedException('Usuario no válido para 2FA');
    }

    const isCodeValid = this.twoFactorAuthService.isTwoFactorAuthenticationCodeValid(
      code,
      user.twoFactorSecret,
    );

    if (!isCodeValid) {
      throw new UnauthorizedException('Código de verificación inválido');
    }

    return this.login(user as any);
  }

  async verifyCriticalOperation(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isTwoFactorEnabled || !user.twoFactorSecret) {
      // Si no tiene 2FA activado, permitimos la operación por ahora si el plan dice que es opcional
      // Pero si está activado, DEBE validar.
      if (!user?.isTwoFactorEnabled) return true;
      throw new UnauthorizedException('2FA es requerido para esta operación');
    }

    const isCodeValid = this.twoFactorAuthService.isTwoFactorAuthenticationCodeValid(
      code,
      user.twoFactorSecret,
    );

    if (!isCodeValid) {
      throw new UnauthorizedException('Código de verificación inválido para operación crítica');
    }

    return true;
  }
}
