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
        key: 'session_timeout_seconds',
        value: '3600',
        description: 'Periodo de inactividad de sesión (en segundos) antes de desconectar automáticamente al usuario.',
        category: 'AUTH',
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
        key: 'webauthn_enabled',
        value: 'false',
        description: 'Habilitar soporte y validaciones con huella digital o FaceID para operaciones críticas y accesos.',
        category: 'AUTH',
      },
      {
        key: 'smtp_host',
        value: 'smtp.gmail.com',
        description: 'Dirección del servidor SMTP utilizado para despachar correos institucionales.',
        category: 'EMAIL',
      },
      {
        key: 'smtp_port',
        value: '587',
        description: 'Puerto de conexión para el servidor de correo (ej: 587 para TLS/STARTTLS, 465 para SSL).',
        category: 'EMAIL',
      },
      {
        key: 'smtp_sender',
        value: 'no-reply@instituto.edu.ec',
        description: 'Dirección de correo electrónico que figurará como remitente en las notificaciones automatizadas.',
        category: 'EMAIL',
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
        key: 'lopdp_version_current',
        value: '1.0',
        description: 'Identificador de la política de protección de datos personales activa en el sistema.',
        category: 'GENERAL',
      },
      {
        key: 'chat_message_retention_days',
        value: '730',
        description: 'Periodo (en días) antes de que los mensajes de chat sean purgados permanentemente según normativas de privacidad.',
        category: 'CHAT',
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
