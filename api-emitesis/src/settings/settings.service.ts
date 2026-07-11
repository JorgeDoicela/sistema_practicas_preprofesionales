import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingDto } from './dto/update-setting.dto';

@Injectable()
export class SettingsService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    try {
      await this.initializeSettings();
    } catch (err) {
      console.error('[SettingsService] Error al inicializar configuraciones por defecto:', err.message);
    }
  }

  private async initializeSettings() {
    const defaultSettings = [
      {
        key: 'attendance_radius_meters',
        value: '100',
        description: 'Radio máximo permitido (en metros) para que los estudiantes registren su entrada y salida en la sede.',
        category: 'GPS',
      },
      {
        key: 'attendance_max_distance_km',
        value: '2.0',
        description: 'Distancia máxima tolerada (en kilómetros) antes de marcar la asistencia como fuera de rango o irregular.',
        category: 'GPS',
      },
      {
        key: 'max_login_attempts',
        value: '5',
        description: 'Número máximo de intentos fallidos permitidos antes de bloquear temporalmente la cuenta.',
        category: 'AUTH',
      },
      {
        key: 'lockout_duration_minutes',
        value: '15',
        description: 'Tiempo (en minutos) que la cuenta permanecerá inactiva tras superar los intentos fallidos.',
        category: 'AUTH',
      },
      {
        key: 'document_max_size_mb',
        value: '10',
        description: 'Límite máximo permitido (en Megabytes) para la subida de documentos PDF en la ventanilla.',
        category: 'GENERAL',
      },
      {
        key: 'allowed_file_types',
        value: 'pdf,docx',
        description: 'Formatos de archivo autorizados para la subida de expedientes y registros académicos.',
        category: 'GENERAL',
      },
      {
        key: 'eval_weight_business',
        value: '0.5',
        description: 'Peso de la evaluación empresarial (0.0 a 1.0) en la nota final ponderada.',
        category: 'GENERAL',
      },
      {
        key: 'eval_weight_academic',
        value: '0.5',
        description: 'Peso de la evaluación académica (0.0 a 1.0) en la nota final ponderada.',
        category: 'GENERAL',
      },
    ];

    for (const setting of defaultSettings) {
      const exists = await this.prisma.systemSetting.findUnique({
        where: { key: setting.key },
      });
      if (!exists) {
        await this.prisma.systemSetting.create({
          data: setting,
        });
      }
    }
  }

  async findAll() {
    return this.prisma.systemSetting.findMany({
      orderBy: { key: 'asc' },
    });
  }

  async findAllCareers() {
    return this.prisma.career.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findByKey(key: string) {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key },
    });
    if (!setting) {
      throw new NotFoundException(`Configuración ${key} no encontrada`);
    }
    return setting;
  }

  async update(key: string, dto: UpdateSettingDto) {
    const exists = await this.prisma.systemSetting.findUnique({ where: { key } });
    if (!exists) {
      throw new NotFoundException(`Configuración '${key}' no encontrada`);
    }
    return this.prisma.systemSetting.update({
      where: { key },
      data: dto,
    });
  }

  /** Obtiene un valor de configuración con fallback */
  async getValue(key: string, defaultValue: string): Promise<string> {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key },
    });
    return setting ? setting.value : defaultValue;
  }

  async getNumberValue(key: string, defaultValue: number): Promise<number> {
    const val = await this.getValue(key, defaultValue.toString());
    const parsed = parseFloat(val);
    return isNaN(parsed) ? defaultValue : parsed;
  }
}
