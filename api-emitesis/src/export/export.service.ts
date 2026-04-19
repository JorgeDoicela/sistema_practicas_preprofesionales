import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';

@Injectable()
export class ExportService {
  constructor(private prisma: PrismaService) {}

  async generateMasterReport(res: Response) {
    const internships = await this.prisma.internship.findMany({
      include: {
        student: true,
        company: true,
        tutor: true,
        documents: true,
        attendances: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!internships || internships.length === 0) {
      throw new NotFoundException('No hay pasantías registradas para exportar');
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte Maestro Pasantías');

    // Estilo de cabeceras
    worksheet.columns = [
      { header: 'ID Pasantía', key: 'id', width: 20 },
      { header: 'Estudiante', key: 'student', width: 30 },
      { header: 'Correo Estudiante', key: 'student_email', width: 30 },
      { header: 'Empresa', key: 'company', width: 30 },
      { header: 'Tutor Académico', key: 'tutor', width: 30 },
      { header: 'Fecha Inicio', key: 'start_date', width: 15 },
      { header: 'Estado Global', key: 'status', width: 15 },
      { header: 'Horas Requeridas', key: 'req_hours', width: 15 },
      { header: 'Horas Completadas', key: 'done_hours', width: 15 },
      { header: '% Progreso', key: 'progress', width: 12 },
      { header: 'Docs Aprobados', key: 'docs_ok', width: 15 },
      { header: 'Ubicación Sede', key: 'location', width: 30 },
    ];

    // Aplicar estilo a la cabecera
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '003366' }, // Azul Emitesis
    };

    internships.forEach((i) => {
      // Calcular horas completadas
      let totalMinutes = 0;
      i.attendances.forEach((att) => {
        if (att.checkIn && att.checkOut) {
          totalMinutes += (att.checkOut.getTime() - att.checkIn.getTime()) / (1000 * 60);
        }
      });
      const doneHours = Number((totalMinutes / 60).toFixed(2));
      const approvedDocs = i.documents.filter((d) => d.status === 'APROBADO_DEFINITIVO').length;
      const progress = i.totalHours > 0 ? (doneHours / i.totalHours) * 100 : 0;

      worksheet.addRow({
        id: i.id.substring(0, 8).toUpperCase(),
        student: i.student.fullName,
        student_email: i.student.email,
        company: i.company.name,
        tutor: i.tutor.fullName,
        start_date: i.startDate.toLocaleDateString(),
        status: i.status,
        req_hours: i.totalHours,
        done_hours: doneHours,
        progress: `${progress.toFixed(1)}%`,
        docs_ok: `${approvedDocs} / ${i.documents.length}`,
        location: i.location,
      });
    });

    // Enviar el archivo
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Reporte_Maestro_Emitesis_${new Date().toISOString().split('T')[0]}.xlsx`,
    );

    await workbook.xlsx.write(res);
    res.end();
  }
}
