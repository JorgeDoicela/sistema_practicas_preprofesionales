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
}
