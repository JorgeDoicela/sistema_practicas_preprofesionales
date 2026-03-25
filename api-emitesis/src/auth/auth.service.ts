import { Injectable, UnauthorizedException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../notifications/email.service';
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
  ) {}

  private async verifyRecaptcha(token: string) {
    const secretKey = this.configService.get<string>('RECAPTCHA_SECRET_KEY');
    
    // Si no hay clave configurada, saltamos la validación (para dev/test)
    if (!secretKey || secretKey === 'PONER_AQUI_TU_CLAVE_SECRETA_DE_GOOGLE') {
      console.warn('reCAPTCHA Secret Key no configurada. Saltando validación.');
      return true;
    }

    try {
      console.log('Validando token con Google...');
      const response = await axios.post<{ success: boolean; 'error-codes'?: string[] }>(
        `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`
      );
      
      console.log('Resultado de Google:', response.data);
      return response.data.success;
    } catch (error: any) {
      console.error('Error verificando reCAPTCHA:', error.message);
      return false;
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = user;
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
      recaptchaToken
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
        console.error('El servicio de email devolvió error:', (emailRes as any).error);
      }
    } catch (emailError: any) {
      console.error('Error fatal disparando el envío de email:', emailError.message);
    }

    return this.login(user);
  }

  login(user: UserPayload) {
    const payload = { 
      email: user.email, 
      sub: user.id, 
      role: user.role,
      fullName: user.fullName 
    };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      }
    };
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

    return { message: 'Contraseña actualizada con éxito' };
  }
}
