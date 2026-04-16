import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AttendanceService } from '../attendance/attendance.service';
import * as ExcelJS from 'exceljs';
import * as puppeteer from 'puppeteer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private attendanceService: AttendanceService,
  ) {}

  async getGlobalStats() {
    const [
      assignmentsCount,
      pendingDocs,
      approvedDocs,
      activeBlocks,
      activeInternships,
      completedInternships,
      totalStudents,
      allActiveInternships,
    ] = await Promise.all([
      // Total de prácticas activas
      this.prisma.internship.count({
        where: { status: { in: ['Activo', 'En Proceso'] } },
      }),
      // Documentos pendientes de revisión final
      this.prisma.document.count({
        where: { status: 'APROBADO_TUTOR' },
      }),
      // Documentos con aprobación definitiva
      this.prisma.document.count({
        where: { status: 'APROBADO_DEFINITIVO' },
      }),
      // Usuarios bloqueados/inactivos
      this.prisma.user.count({
        where: {
          OR: [
            { isActive: false },
            { lockoutUntil: { gte: new Date() } },
          ],
        },
      }),
      // Prácticas en ejecución
      this.prisma.internship.count({
        where: { status: { in: ['Activo', 'En Proceso'] } },
      }),
      // Prácticas finalizadas
      this.prisma.internship.count({
        where: { status: 'Finalizado' },
      }),
      // Total de estudiantes registrados
      this.prisma.user.count({
        where: { role: 'ESTUDIANTE', isActive: true },
      }),
      // Detalle de prácticas activas para calcular horas
      this.prisma.internship.findMany({
        where: { status: { in: ['Activo', 'En Proceso'] } },
        include: { attendances: true },
      }),
    ]);

    let totalCompletedHours = 0;
    let totalPlannedHours = 0;

    for (const internship of allActiveInternships) {
      totalPlannedHours += internship.totalHours;
      let internshipMinutes = 0;
      for (const att of internship.attendances) {
        if (att.checkIn && att.checkOut) {
          const diff = att.checkOut.getTime() - att.checkIn.getTime();
          internshipMinutes += Math.floor(diff / (1000 * 60));
        }
      }
      totalCompletedHours += Number((internshipMinutes / 60).toFixed(2));
    }

    return {
      assignmentsCount,
      pendingDocs,
      approvedDocs,
      activeBlocks,
      activeInternships,
      completedInternships,
      totalStudents,
      totalCompletedHours: Math.round(totalCompletedHours),
      totalPlannedHours: Math.round(totalPlannedHours),
      progressPercentage:
        totalPlannedHours > 0
          ? Math.round((totalCompletedHours / totalPlannedHours) * 100)
          : 0,
    };
  }

  async exportGlobalStatusExcel() {
    const internships = await this.prisma.internship.findMany({
      include: {
        student: true,
        company: true,
        tutor: true,
        attendances: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Estado Global Prácticas');

    worksheet.columns = [
      { header: 'Estudiante', key: 'student', width: 30 },
      { header: 'Empresa', key: 'company', width: 30 },
      { header: 'Tutor Académico', key: 'tutor', width: 30 },
      { header: 'Estado', key: 'status', width: 15 },
      { header: 'Horas Planificadas', key: 'planned', width: 20 },
      { header: 'Horas Cumplidas', key: 'completed', width: 20 },
      { header: '% Progreso', key: 'progress', width: 15 },
      { header: 'Fecha Inicio', key: 'start', width: 15 },
    ];

    for (const i of internships) {
      let minutes = 0;
      i.attendances.forEach(a => {
        if (a.checkIn && a.checkOut) {
          minutes += Math.floor((a.checkOut.getTime() - a.checkIn.getTime()) / 60000);
        }
      });
      const completed = Number((minutes / 60).toFixed(2));
      const progress = i.totalHours > 0 ? ((completed / i.totalHours) * 100).toFixed(1) + '%' : '0%';

      worksheet.addRow({
        student: i.student.fullName,
        company: i.company.name,
        tutor: i.tutor.fullName,
        status: i.status,
        planned: i.totalHours,
        completed: completed,
        progress: progress,
        start: i.startDate.toLocaleDateString(),
      });
    }

    // Styling
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    return workbook.xlsx.writeBuffer();
  }

  async exportGlobalStatusPdf() {
    const stats = await this.getGlobalStats();
    const internships = await this.prisma.internship.findMany({
      include: {
        student: true,
        company: true,
        tutor: true,
        attendances: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const reportData = internships.map(i => {
      let minutes = 0;
      i.attendances.forEach(a => {
        if (a.checkIn && a.checkOut) {
          minutes += Math.floor((a.checkOut.getTime() - a.checkIn.getTime()) / 60000);
        }
      });
      const completed = Number((minutes / 60).toFixed(2));
      return {
        student: i.student.fullName,
        company: i.company.name,
        status: i.status,
        planned: i.totalHours,
        completed: completed,
        progress: i.totalHours > 0 ? Math.round((completed / i.totalHours) * 100) : 0,
      };
    });

    const templatePath = path.join(process.cwd(), 'src/templates/global-report.hbs');
    if (!fs.existsSync(templatePath)) {
        // Fallback or create default if not exists
        return Buffer.from('Template not found');
    }
    const templateSource = fs.readFileSync(templatePath, 'utf8');
    const template = handlebars.compile(templateSource);

    const html = template({
      date: new Date().toLocaleString(),
      stats,
      internships: reportData,
    });

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setContent(html);
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
    });
    await browser.close();

    return pdfBuffer;
  }

  async exportInternshipAttendanceExcel(internshipId: string) {
    const internship = await this.prisma.internship.findUnique({
      where: { id: internshipId },
      include: {
        student: true,
        company: true,
        attendances: { orderBy: { checkIn: 'desc' } },
      },
    });

    if (!internship) throw new NotFoundException('Asignación no encontrada');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Asistencia');

    worksheet.addRow(['Estudiante:', internship.student.fullName]);
    worksheet.addRow(['Empresa:', internship.company.name]);
    worksheet.addRow(['Total Horas Planificadas:', internship.totalHours]);
    worksheet.addRow([]);

    worksheet.columns = [
      { header: 'Fecha', key: 'date', width: 15 },
      { header: 'Entrada', key: 'checkIn', width: 15 },
      { header: 'Salida', key: 'checkOut', width: 15 },
      { header: 'Duración (Horas)', key: 'duration', width: 15 },
      { header: 'Distancia (m)', key: 'distance', width: 15 },
    ];

    let totalHours = 0;
    internship.attendances.forEach(a => {
      let duration = 0;
      if (a.checkIn && a.checkOut) {
        duration = (a.checkOut.getTime() - a.checkIn.getTime()) / 3600000;
        totalHours += duration;
      }
      worksheet.addRow({
        date: a.checkIn.toLocaleDateString(),
        checkIn: a.checkIn.toLocaleTimeString(),
        checkOut: a.checkOut ? a.checkOut.toLocaleTimeString() : '—',
        duration: duration.toFixed(2),
        distance: a.distanceKm ? (a.distanceKm * 1000).toFixed(0) : '—',
      });
    });

    worksheet.addRow([]);
    worksheet.addRow(['TOTAL HORAS CUMPLIDAS:', totalHours.toFixed(2)]);

    return workbook.xlsx.writeBuffer();
  }
}
