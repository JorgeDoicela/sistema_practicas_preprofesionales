import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { RolesGuard } from '../auth/strategies/roles.guard';
import { Roles } from '../auth/strategies/roles.decorator';
import { Role } from '@prisma/client';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

class SuggestDescriptionDto {
  @IsString()
  @IsNotEmpty()
  base64Image: string;

  @IsOptional()
  @IsString()
  mimeType?: string;
}

class AskDto {
  @IsString()
  @IsNotEmpty()
  question: string;

  @IsString()
  @IsNotEmpty()
  context: string;
}

class PreVerifyDto {
  @IsString()
  @IsNotEmpty()
  documentName: string;

  @IsString()
  @IsNotEmpty()
  base64Image: string;
}

@Controller('ai')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  /** Verificar si el servicio de IA está disponible */
  @Get('status')
  @Roles(Role.ESTUDIANTE, Role.ADMIN, Role.COORDINADOR, Role.TUTOR)
  getStatus() {
    return { available: this.aiService.isAvailable };
  }

  /**
   * RF-18: Analizar imagen de actividad y sugerir descripción.
   * Recibe la imagen en base64 y devuelve una descripción generada por IA.
   */
  @Post('suggest-description')
  @Roles(Role.ESTUDIANTE, Role.ADMIN)
  async suggestDescription(@Body() body: SuggestDescriptionDto) {
    const description = await this.aiService.suggestActivityDescription(
      body.base64Image,
      body.mimeType,
    );
    return { description };
  }

  /**
   * RF-AI-01: Endpoint de consulta para el Copilot de Estudiantes.
   */
  @Post('ask')
  @Roles(Role.ESTUDIANTE, Role.ADMIN)
  async ask(@Body() body: AskDto) {
    const answer = await this.aiService.askQuestion(
      body.context,
      body.question,
    );
    return { answer };
  }

  /**
   * RF-AI-01: Pre-verificación de documentos PDF.
   */
  @Post('pre-verify')
  @Roles(Role.ESTUDIANTE, Role.ADMIN)
  async preVerify(@Body() body: PreVerifyDto) {
    return this.aiService.preVerifyDocument(
      body.documentName,
      body.base64Image,
    );
  }
}
