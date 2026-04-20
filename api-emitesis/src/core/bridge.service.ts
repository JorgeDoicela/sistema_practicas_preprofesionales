import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class BridgeService {
  private readonly logger = new Logger(BridgeService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Mock de sincronización con SIGAFI (Sistema de Gestión Académica).
   * En producción, esto usaría mTLS y endpoints reales.
   */
  async syncStudentData(studentId: string) {
    this.logger.log(`Iniciando sincronización SIGAFI para estudiante: ${studentId}`);
    
    // Simular latencia de red institucional
    await new Promise(resolve => setTimeout(resolve, 1500));

    const user = await this.prisma.user.findUnique({
      where: { id: studentId },
      include: { career: true }
    });

    if (!user) return { success: false, message: 'Usuario no encontrado' };

    // RF-BRIDGE-001: Validar estatus de matrícula en sistema central
    const mockSigafiResponse = {
      isEnrolled: true,
      lastSemester: '5to Nivel',
      facultyCode: user.career?.faculty || 'F-SW',
      gpa: 8.5
    };

    this.logger.log(`Sincronización SIGAFI exitosa para ${user.fullName}`);

    return {
      success: true,
      timestamp: new Date(),
      externalData: mockSigafiResponse
    };
  }
}
