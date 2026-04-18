import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAgreementDto } from './dto/create-agreement.dto';
import { EmailService } from '../notifications/email.service';

@Injectable()
export class AgreementsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async create(createAgreementDto: CreateAgreementDto, filePath: string) {
    const { ruc, companyName, address, representative, email, startDate } = createAgreementDto;

    try {
      return await this.prisma.$transaction(async (tx) => {
        // RF-CON-001 (Optimizado): Buscar o actualizar empresa
        const company = await tx.company.upsert({
          where: { ruc },
          update: {
            name: companyName,
            address,
            representative,
            email,
          },
          create: {
            ruc,
            name: companyName,
            address,
            representative,
            email,
          },
        });

        // 5. El sistema guarda el nuevo convenio (Historial)
        const agreement = await tx.agreement.create({
          data: {
            companyId: company.id,
            startDate: new Date(startDate),
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

        return agreement;
      });
    } catch (error: unknown) {
      throw new BadRequestException('Error al registrar el convenio: ' + (error as Error).message);
    }
  }

  async findAll() {
    return this.prisma.agreement.findMany({
      include: { company: true },
      orderBy: { createdAt: 'desc' }
    });
  }
}
