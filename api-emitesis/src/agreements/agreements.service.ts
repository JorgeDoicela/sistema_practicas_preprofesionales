import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAgreementDto } from './dto/create-agreement.dto';
import { EmailService } from '../notifications/email.service';
import { SystemLogsService } from '../system-logs/system-logs.service';
import { validateEcuadorianRUC } from '../common/utils/validators';

@Injectable()
export class AgreementsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private systemLogs: SystemLogsService,
  ) {}

  async create(createAgreementDto: CreateAgreementDto, filePath: string) {
    const { ruc, companyName, address, city, representative, email, phone, sector, startDate, endDate, type, maxInterns } = createAgreementDto;

    // Validación de RUC (Backend Integrity)
    if (!validateEcuadorianRUC(ruc)) {
      throw new BadRequestException('El RUC proporcionado no es válido para los estándares de Ecuador.');
    }

    // Validación de Fechas
    const start = new Date(startDate);
    if (isNaN(start.getTime())) {
      throw new BadRequestException('La fecha de inicio proporcionada no es válida.');
    }

    if (endDate && endDate.trim() !== '') {
      const end = new Date(endDate);
      if (isNaN(end.getTime())) {
        throw new BadRequestException('La fecha de vencimiento proporcionada no es válida.');
      }
      if (end <= start) {
        throw new BadRequestException('La fecha de vencimiento del convenio debe ser posterior a la fecha de inicio.');
      }
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        // RF-CON-001: Buscar o actualizar empresa
        const company = await tx.company.upsert({
          where: { ruc },
          update: {
            name: companyName,
            address,
            ...(city !== undefined && { city }),
            representative,
            email,
            ...(phone !== undefined && { phone }),
            ...(sector !== undefined && { sector }),
          },
          create: {
            ruc,
            name: companyName,
            address,
            city,
            representative,
            email,
            phone,
            sector,
          },
        });

        // REGLA DE NEGOCIO: Solo puede haber un convenio "Activo" a la vez por empresa.
        // Desactivamos los convenios previos (Historial)
        await tx.agreement.updateMany({
          where: { companyId: company.id, status: 'Activo' },
          data: { status: 'Histórico' },
        });

        // 5. El sistema guarda el nuevo convenio (Historial)
        const agreement = await tx.agreement.create({
          data: {
            companyId: company.id,
            startDate: new Date(startDate),
            endDate: (endDate && endDate.trim() !== '') ? new Date(endDate) : null,
            type: type ?? 'GENERAL',
            maxInterns: maxInterns ?? 1,
            filePath: filePath,
            status: 'Activo',
          },
          include: {
            company: true
          }
        });

        // RF-CON-002: Notificar a empresa sobre convenio por correo
        this.emailService.sendAgreementNotification(
          company.email,
          company.name,
          filePath,
          { agreementId: agreement.id, companyId: company.id }
        ).catch((err: Error) => {
          console.error('Error disparando notificación de convenio:', err.message);
        });

        this.systemLogs.append({
          level: 'INFO',
          category: 'HTTP',
          message: `Convenio registrado exitosamente para la empresa: ${company.name}`,
          userId: 'SYSTEM',
          metadata: { agreementId: agreement.id, ruc: company.ruc, companyId: company.id }
        });
        
        return agreement;
      });
    } catch (error: unknown) {
      throw new BadRequestException('Error al registrar el convenio: ' + (error as Error).message);
    }
  }

  async findAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.agreement.findMany({
        skip,
        take: limit,
        include: { company: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.agreement.count(),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }
}
