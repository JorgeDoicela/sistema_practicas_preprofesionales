import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AttendanceService } from '../attendance/attendance.service';
import { StorageService } from '../infrastructure/storage/storage.service';
import * as puppeteer from 'puppeteer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CertificationService {
  constructor(
    private prisma: PrismaService,
    private attendanceService: AttendanceService,
    private storageService: StorageService,
  ) {}

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

    // 1. Verificar los 8 documentos obligatorios (deben estar APROBADO_DEFINITIVO)
    // El "Certificado de culminación" es el 8avo, pero este se genera ahora.
    // Los otros 7 deben estar aprobados.
    const requiredDocs = [
      'Solicitud de prácticas',
      'Plan de rotación',
      'Informe de actividades',
      'Registro de asistencia',
      'Evaluación del tutor académico',
      'Evaluación del representante de la empresa',
      'Informe final de prácticas',
    ];

    const approvedDocs = internship.documents.filter(
      (doc) => requiredDocs.includes(doc.name) && doc.status === 'APROBADO_DEFINITIVO'
    );

    const missingDocs = requiredDocs.filter(
      (name) => !approvedDocs.find((doc) => doc.name === name)
    );

    // 2. Verificar horas completadas
    const summary = await this.attendanceService.getSummary(internshipId);
    const hoursMet = summary.totalHours >= internship.totalHours;

    return {
      eligible: missingDocs.length === 0 && hoursMet,
      details: {
        approvedDocsCount: approvedDocs.length,
        totalRequiredDocs: requiredDocs.length,
        missingDocs,
        totalHours: summary.totalHours,
        requiredHours: internship.totalHours,
        hoursMet,
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

    const certificateData = {
      studentName: internship.student.fullName,
      companyName: internship.company.name,
      tutorName: internship.tutor.fullName,
      totalHours: eligibility.details.totalHours,
      startDate: internship.startDate.toLocaleDateString(),
      endDate: new Date().toLocaleDateString(),
      certificateId: internship.id.split('-')[0].toUpperCase(),
      issueDate: new Date().toLocaleDateString(),
    };

    const html = template(certificateData);

    // Generar PDF con Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setContent(html);
    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
    });
    await browser.close();

    // Subir a Storage
    const fileName = `certificates/${internshipId}/certificado-${Date.now()}.pdf`;
    const uploadResult = await this.storageService.upload(fileName, Buffer.from(pdfBuffer), {
        contentType: 'application/pdf',
    });

    // Actualizar el documento "Certificado de culminación"
    const certDoc = await this.prisma.document.findFirst({
        where: {
            internshipId,
            name: 'Certificado de culminación'
        }
    });

    if (certDoc) {
        await this.prisma.document.update({
            where: { id: certDoc.id },
            data: {
                filePath: uploadResult.url,
                status: 'APROBADO_DEFINITIVO',
                submittedAt: new Date(),
                reviewedAt: new Date()
            }
        });
    }

    // Actualizar estado de la pasantía a Finalizado
    await this.prisma.internship.update({
        where: { id: internshipId },
        data: { status: 'Finalizado' }
    });

    return {
      url: uploadResult.url,
      message: 'Certificado generado exitosamente',
    };
  }
}
