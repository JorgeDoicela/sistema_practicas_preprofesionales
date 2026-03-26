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

    // A3: RUC duplicado
    const existingCompany = await this.prisma.company.findUnique({
      where: { ruc },
    });

    if (existingCompany) {
      throw new ConflictException({
        message: 'La empresa con este RUC ya existe en el sistema',
        companyId: existingCompany.id
      });
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        // 5. El sistema guarda la información de la empresa
        const company = await tx.company.create({
          data: {
            ruc,
            name: companyName,
            address,
            representative,
            email,
          },
        });

        // 5. El sistema guarda el convenio
        const agreement = await tx.agreement.create({
          data: {
            companyId: company.id,
            startDate: new Date(startDate),
            filePath: filePath,
            status: 'Activo', // Postcondición: Estado 'Activo'
          },
          include: {
            company: true
          }
        });

        // RF-CON-002: Notificar a empresa sobre convenio por correo
        // Se dispara después de que la transacción fue exitosa
        this.emailService.sendAgreementNotification(
          company.email,
          company.name,
          filePath,
          { agreementId: agreement.id, companyId: company.id }
        ).catch((err: Error) => {
          // Loggear error si el proceso de envío falla (pero el convenio ya se guardó)
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
