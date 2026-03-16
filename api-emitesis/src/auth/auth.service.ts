import { Injectable, UnauthorizedException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterCompanyDto } from './dto/register-company.dto';
import * as bcrypt from 'bcrypt';
import axios from 'axios';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  private async verifyRecaptcha(token: string) {
    const secretKey = this.configService.get<string>('RECAPTCHA_SECRET_KEY');
    
    // Si no hay clave configurada, saltamos la validación (para dev/test)
    if (!secretKey || secretKey === 'PONER_AQUI_TU_CLAVE_SECRETA_DE_GOOGLE') {
      console.warn('reCAPTCHA Secret Key no configurada. Saltando validación.');
      return true;
    }

    try {
      const response = await axios.post(
        `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`
      );
      
      return response.data.success;
    } catch (error) {
      console.error('Error verificando reCAPTCHA:', error);
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
      const updateData: any = { failedAttempts: newFailedAttempts };

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
    const isRecaptchaValid = await this.verifyRecaptcha(recaptchaToken);
    if (!isRecaptchaValid) {
      throw new BadRequestException('Validación de reCAPTCHA fallida');
    }

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
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        role: 'EMPRESA',
        companyId: company.id,
      },
    });

    return this.login(user);
  }

  async login(user: any) {
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
}
