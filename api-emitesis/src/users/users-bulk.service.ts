import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as ExcelJS from 'exceljs';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { SystemLogsService } from '../system-logs/system-logs.service';

@Injectable()
export class UsersBulkService {
  private readonly logger = new Logger(UsersBulkService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly systemLogs: SystemLogsService,
  ) {}

  /**
   * Importa usuarios masivamente desde un buffer de Excel.
   * Formato esperado: [Email, Nombre Completo, Rol, Nombre de Carrera]
   */
  async importFromExcel(buffer: Buffer, currentUserId: string) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);
    const worksheet = workbook.getWorksheet(1);
    
    if (!worksheet || worksheet.rowCount > 500) {
      throw new BadRequestException('El archivo Excel es inválido o supera el límite de 500 registros por carga.');
    }

    const usersToCreate: any[] = [];
    const errors: string[] = [];
    const careersMap = new Map<string, string>();

    // Precargar carreras para optimizar
    const careers = await this.prisma.career.findMany();
    careers.forEach(c => careersMap.set(c.name.toLowerCase(), c.id));

    const defaultPassword = await bcrypt.hash('Istpet.2026@Secure', 10);

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Saltar cabecera

      // Sanitización de entradas (OWASP A03)
      const email = row.getCell(1).text?.trim().toLowerCase().replace(/[<>\/\\"'`]/g, '');
      const fullName = row.getCell(2).text?.trim().replace(/[<>\/\\"'`]/g, '');
      const roleStr = row.getCell(3).text?.trim().toUpperCase();
      const careerName = row.getCell(4).text?.trim();

      if (!email || !fullName || !roleStr) {
        errors.push(`Fila ${rowNumber}: Datos incompletos (Email, Nombre y Rol son obligatorios)`);
        return;
      }

      const role = Role[roleStr as keyof typeof Role];
      if (!role) {
        errors.push(`Fila ${rowNumber}: Rol '${roleStr}' no es válido`);
        return;
      }

      let careerId: string | null = null;
      if (careerName) {
        careerId = careersMap.get(careerName.toLowerCase()) || null;
        if (!careerId) {
          errors.push(`Fila ${rowNumber}: Carrera '${careerName}' no encontrada en el sistema`);
          return;
        }
      }

      usersToCreate.push({
        email,
        fullName,
        role,
        careerId,
        password: defaultPassword,
      });
    });

    if (usersToCreate.length === 0) {
      throw new BadRequestException('No se encontraron usuarios válidos para importar. Errores: ' + errors.join(', '));
    }

    let createdCount = 0;
    let skippedCount = 0;

    for (const userData of usersToCreate) {
      try {
        const existing = await this.prisma.user.findUnique({ where: { email: userData.email } });
        if (existing) {
          skippedCount++;
          continue;
        }

        await this.prisma.user.create({ data: userData });
        createdCount++;
      } catch (error) {
        this.logger.error(`Error importando usuario ${userData.email}: ${error.message}`);
        errors.push(`Error al crear ${userData.email}: ${error.message}`);
      }
    }

    this.systemLogs.append({
      level: 'INFO',
      category: 'SYSTEM',
      message: `Importación masiva completada: ${createdCount} creados, ${skippedCount} omitidos.`,
      userId: currentUserId,
      metadata: { createdCount, skippedCount, errorsCount: errors.length }
    });

    return {
      success: true,
      summary: {
        created: createdCount,
        skipped: skippedCount,
        total: usersToCreate.length
      },
      errors: errors.length > 0 ? errors : null
    };
  }
}
