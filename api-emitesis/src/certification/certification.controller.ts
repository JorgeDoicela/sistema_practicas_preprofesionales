import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { CertificationService } from './certification.service';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { RolesGuard } from '../auth/strategies/roles.guard';
import { Roles } from '../auth/strategies/roles.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('certification')
@Controller('certification')
export class CertificationController {
  constructor(private readonly certificationService: CertificationService) {}

  /** Endpoint PÚBLICO — verifica autenticidad de un certificado por código */
  @Get('verify/:code')
  @ApiOperation({ summary: 'Verificar autenticidad de certificado (público)' })
  async verifyCertificate(@Param('code') code: string) {
    return this.certificationService.verifyCertificate(code);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('check/:internshipId')
  @Roles('COORDINADOR')
  @ApiOperation({ summary: 'Verificar elegibilidad para certificado' })
  async checkEligibility(@Param('internshipId') internshipId: string) {
    return this.certificationService.checkEligibility(internshipId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('generate/:internshipId')
  @Roles('COORDINADOR')
  @ApiOperation({ summary: 'Generar certificado de culminación' })
  async generateCertificate(@Param('internshipId') internshipId: string) {
    return this.certificationService.generateCertificate(internshipId);
  }
}
