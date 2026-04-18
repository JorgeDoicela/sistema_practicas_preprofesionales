import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingDto } from './dto/update-setting.dto';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.systemSetting.findMany({
      orderBy: { key: 'asc' },
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
