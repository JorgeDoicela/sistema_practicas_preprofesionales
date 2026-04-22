import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AttendanceService } from '../attendance/attendance.service';
import { StorageService } from '../infrastructure/storage/storage.service';
import { EmailService } from '../notifications/email.service';
import * as puppeteer from 'puppeteer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import { randomBytes } from 'crypto';

@Injectable()
export class CertificationService {
  constructor(
    private prisma: PrismaService,
    private attendanceService: AttendanceService,
    private storageService: StorageService,
    private emailService: EmailService,
  ) {}

  async verifyCertificate(code: string) {
    const doc = await this.prisma.document.findFirst({
      where: { verificationCode: code, isCertificateSlot: true },
      include: {
        internship: {
          include: {
            student: { select: { fullName: true, cedula: true } },
            company: { select: { name: true, ruc: true } },
            tutor: { select: { fullName: true } },
          },
        },
      },
    });

    if (!doc || doc.status !== 'APROBADO_DEFINITIVO') {
      throw new NotFoundException('Certificado no encontrado o no válido');
    }

    return {
      valid: true,
      verificationCode: code,
      student: doc.internship.student.fullName,
      cedula: doc.internship.student.cedula,
      company: doc.internship.company.name,
      tutor: doc.internship.tutor.fullName,
      totalHours: doc.internship.totalHours,
      startDate: doc.internship.startDate,
      endDate: doc.internship.endDate,
      issuedAt: doc.reviewedAt,
      certificateUrl: doc.filePath,
    };
  }

  async checkEligibility(internshipId: string) {
    const internship = await this.prisma.internship.findUnique({
      where: { id: internshipId },
      include: {
        documents: true,
        student: true,
      },
    });

    if (!internship) {
      throw new NotFoundException('Asignación no encontrada');
    }

    // 1. Documentos obligatorios (excluye ranura de certificado y opcionales isRequired=false)
    const requiredSlots = internship.documents.filter(
      (doc) =>
        !doc.isCertificateSlot &&
        doc.name !== 'Certificado de culminación' &&
        doc.isRequired,
    );

    const approvedDocs = requiredSlots.filter((doc) => doc.status === 'APROBADO_DEFINITIVO');

    const missingDocs = requiredSlots
      .filter((doc) => doc.status !== 'APROBADO_DEFINITIVO')
      .map((doc) => doc.name);

    // 2. Verificar horas completadas
    const summary = await this.attendanceService.getSummary(internshipId);
    const hoursMet = summary.totalHours >= internship.totalHours;

    // 3. Verificar que existan ambas evaluaciones (académica y empresarial)
    const evaluations = await this.prisma.evaluation.findMany({
      where: { internshipId },
    });
    const hasAcademica = evaluations.some((e) => e.type === 'ACADEMICA');
    const hasEmpresarial = evaluations.some((e) => e.type === 'EMPRESARIAL');
    const missingEvals: string[] = [];
    if (!hasAcademica) missingEvals.push('Evaluación académica (Tutor)');
    if (!hasEmpresarial) missingEvals.push('Evaluación empresarial (Empresa)');

    // 4. Verificar que el estado de la práctica no sea Suspendida o Retirada
    if (internship.status === 'Suspendida' || internship.status === 'Retirada') {
      throw new BadRequestException(
        `No se puede generar el certificado: la práctica está en estado "${internship.status}".`,
      );
    }

    return {
      eligible: missingDocs.length === 0 && hoursMet && missingEvals.length === 0,
      details: {
        approvedDocsCount: approvedDocs.length,
        totalRequiredDocs: requiredSlots.length,
        missingDocs,
        totalHours: summary.totalHours,
        requiredHours: internship.totalHours,
        hoursMet,
        hasAcademica,
        hasEmpresarial,
        missingEvals,
      },
    };
  }

  async generateCertificate(internshipId: string) {
    const eligibility = await this.checkEligibility(internshipId);
    if (!eligibility.eligible) {
      throw new BadRequestException({
        message: 'El estudiante no cumple con los requisitos para la certificación',
        details: eligibility.details,
      });
    }

    const internship = await this.prisma.internship.findUnique({
      where: { id: internshipId },
      include: {
        student: true,
        company: true,
        tutor: true,
      },
    });

    if (!internship) {
      throw new NotFoundException('Asignación no encontrada');
    }

    // Cargar plantilla
    const templatePath = path.join(process.cwd(), 'src/templates/certificate.hbs');
    const templateSource = fs.readFileSync(templatePath, 'utf8');
    const template = handlebars.compile(templateSource);

    const localeOpts: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'long', year: 'numeric' };
    const certificateData = {
      studentName: internship.student.fullName,
      studentCedula: internship.student.cedula ?? '',
      companyName: internship.company.name,
      tutorName: internship.tutor.fullName,
      totalHours: eligibility.details.totalHours,
      startDate: internship.startDate.toLocaleDateString('es-EC', localeOpts),
      endDate: internship.endDate
        ? internship.endDate.toLocaleDateString('es-EC', localeOpts)
        : new Date().toLocaleDateString('es-EC', localeOpts),
      certificateId: internship.id.split('-')[0].toUpperCase(),
      issueDate: new Date().toLocaleDateString('es-EC', localeOpts),
    };

    const html = template(certificateData);

    // Generar PDF con Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    let pdfBuffer: Buffer;
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      pdfBuffer = Buffer.from(await page.pdf({
        format: 'A4',
        landscape: true,
        printBackground: true,
      }));
    } finally {
      await browser.close();
    }

    // Subir a Storage
    const fileName = `certificates/${internshipId}/certificado-${Date.now()}.pdf`;
    const uploadResult = await this.storageService.upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
    });

    const certDoc = await this.prisma.document.findFirst({
      where: {
        internshipId,
        OR: [{ isCertificateSlot: true }, { name: 'Certificado de culminación' }],
      },
    });

    const verificationCode = randomBytes(8).toString('hex').toUpperCase();

    if (certDoc) {
        await this.prisma.document.update({
            where: { id: certDoc.id },
            data: {
                filePath: uploadResult.url,
                status: 'APROBADO_DEFINITIVO',
                submittedAt: new Date(),
                reviewedAt: new Date(),
                verificationCode,
            }
        });
    } else {
        // No existía un slot de certificado; crear el documento directamente
        await this.prisma.document.create({
            data: {
                internshipId,
                name: 'Certificado de culminación',
                filePath: uploadResult.url,
                status: 'APROBADO_DEFINITIVO',
                isCertificateSlot: true,
                isRequired: false,
                submittedAt: new Date(),
                reviewedAt: new Date(),
                verificationCode,
            }
        });
    }

    // Actualizar estado de la pasantía a Finalizado
    await this.prisma.internship.update({
        where: { id: internshipId },
        data: { status: 'Finalizado' }
    });

    // Enviar notificación al estudiante (RF-NOT-001)
    await this.emailService.sendCertificateNotification(
        internship.student.email,
        internship.student.fullName,
        uploadResult.url
    );

    return {
      url: uploadResult.url,
      verificationCode,
      message: 'Certificado generado exitosamente',
    };
  }
}
