import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import * as nodemailer from 'nodemailer';
import * as ExcelJS from 'exceljs';

@Injectable()
export class EmailService {
    private transporter: nodemailer.Transporter;
    private readonly logger = new Logger(EmailService.name);

    constructor(
        private configService: ConfigService,
        private prisma: PrismaService,
    ) {
        this.transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: this.configService.get<string>('MAIL_USER'),
                pass: this.configService.get<string>('MAIL_PASS'),
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        this.transporter.verify((error) => {
            if (error) {
                this.logger.error('Error de configuración de Gmail:', (error as any).message);
            } else {
                this.logger.log('Servidor de correo listo para enviar mensajes');
            }
        });
    }

    private getPublicAppBase(): string {
        const raw = this.configService.get<string>('PUBLIC_APP_URL');
        const trimmed = (raw ?? '').trim().replace(/\/$/, '');
        if (trimmed) return trimmed;
        return 'https://sistema-practicas-preprofesionales.vercel.app';
    }

    /**
     * Motor de plantillas unificado con estética Premium (Blue/Gold)
     */
    private getHtmlTemplate(title: string, content: string, actionLabel?: string, actionUrl?: string, alertType: 'SUCCESS' | 'INFO' | 'WARNING' | 'ERROR' = 'INFO') {
        const accentColor = alertType === 'ERROR' || alertType === 'WARNING' ? '#d32f2f' : '#C5A059';
        
        return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            .body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; margin: 0; padding: 40px 0; color: #1e293b; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); border: 1px solid #e2e8f0; }
            .header { background-color: #003366; padding: 40px; text-align: center; position: relative; overflow: hidden; }
            .header-accent { position: absolute; top: 0; right: 0; width: 100px; height: 100px; background-color: #C5A059; opacity: 0.1; border-radius: 50%; margin-top: -50px; margin-right: -50px; }
            .content { padding: 40px; line-height: 1.6; }
            .title { color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em; text-transform: uppercase; }
            .subtitle { color: #C5A059; margin-top: 8px; font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; }
            .button-container { text-align: center; margin: 40px 0; }
            .button { background-color: #003366; color: #ffffff !important; padding: 16px 32px; text-decoration: none; border-radius: 16px; font-weight: 800; font-size: 14px; letter-spacing: 0.05em; text-transform: uppercase; display: inline-block; box-shadow: 0 10px 15px -3px rgba(0, 51, 102, 0.2); }
            .footer { background-color: #f1f5f9; padding: 32px; text-align: center; border-top: 1px solid #e2e8f0; }
            .footer-text { font-size: 12px; color: #64748b; margin: 0; font-weight: 500; }
            .highlight { color: #003366; font-weight: 700; }
            .alert-box { background-color: #f8fafc; border-left: 4px solid ${accentColor}; padding: 20px; border-radius: 12px; margin: 24px 0; }
          </style>
        </head>
        <body class="body">
          <div class="container">
            <div class="header">
              <div class="header-accent"></div>
              <h1 class="title">${title}</h1>
              <div class="subtitle">Sistema EmiTesis • ISTPET</div>
            </div>
            <div class="content">
              ${content}
              ${actionLabel && actionUrl ? `
              <div class="button-container">
                <a href="${actionUrl}" class="button">${actionLabel}</a>
              </div>` : ''}
              <p style="font-size: 13px; color: #64748b; margin-top: 32px;">
                Este es un mensaje automático generado por el sistema de gestión de prácticas cada vez que se produce una actividad relevante en su expediente.
              </p>
            </div>
            <div class="footer">
              <p class="footer-text">© 2026 Instituto Superior Tecnológico "Mayor Pedro Traversari"</p>
              <p class="footer-text" style="margin-top: 8px; font-size: 10px; opacity: 0.7;">Quito, Ecuador • Coordinación de Vinculación</p>
            </div>
          </div>
        </body>
        </html>
        `;
    }

    async sendWelcomeEmail(email: string, fullName: string) {
        try {
            const content = `
                <p>Estimado/a <span class="highlight">${fullName}</span>,</p>
                <p>Es un placer darle la bienvenida al <span class="highlight">Sistema de Gestión de Prácticas Preprofesionales ISTPET</span>.</p>
                <p>Su registro institucional ha sido procesado exitosamente. A partir de este momento, podrá gestionar sus convenios y realizar el seguimiento de los procesos de vinculación con nuestra comunidad académica.</p>
                <div class="alert-box">
                    <strong>Información Importante:</strong> Su cuenta se encuentra activa y vinculada a su identidad institucional. Utilice sus credenciales corporativas para acceder.
                </div>
            `;
            const html = this.getHtmlTemplate('¡Bienvenido al Sistema!', content, 'Acceder al Portal', `${this.getPublicAppBase()}/login`);

            await this.transporter.sendMail({
                from: `"ISTPET" <${this.configService.get<string>('MAIL_USER')}>`,
                to: email,
                subject: '¡Bienvenido al Sistema de Prácticas Preprofesionales ISTPET!',
                html
            });
            return { success: true };
        } catch (err: any) {
            this.logger.error('Error enviando email welcome:', (err).message);
            return { success: false, error: (err).message };
        }
    }

    async sendPasswordResetEmail(email: string, fullName: string, token: string) {
        try {
            const resetLink = `${this.getPublicAppBase()}/reset-password?token=${token}`;
            const content = `
                <p>Hola <span class="highlight">${fullName}</span>,</p>
                <p>Hemos recibido una solicitud para restablecer la contraseña de su cuenta en el Sistema ISTPET.</p>
                <div class="alert-box">
                    <strong>Seguridad:</strong> Por motivos de protección de datos, este enlace tiene una validez de 60 minutos.
                </div>
                <p>Si usted no realizó esta solicitud, puede ignorar este mensaje de forma segura.</p>
            `;
            const html = this.getHtmlTemplate('Recuperación de Acceso', content, 'Restablecer Contraseña', resetLink, 'WARNING');

            await this.transporter.sendMail({
                from: `"Soporte ISTPET" <${this.configService.get<string>('MAIL_USER')}>`,
                to: email,
                subject: 'Recuperación de Contraseña - Sistema ISTPET',
                html
            });
            return { success: true };
        } catch (err: any) {
            this.logger.error('Error enviando reset email:', (err).message);
            return { success: false, error: (err).message };
        }
    }

    async sendAgreementNotification(email: string, companyName: string, filePath: string, metadata: Prisma.InputJsonValue = {}) {
        const subject = 'Nuevo Convenio de Prácticas Preprofesionales - ISTPET';
        try {
            const content = `
                <p>Estimados representantes de <span class="highlight">${companyName}</span>,</p>
                <p>Se ha generado un nuevo convenio de prácticas preprofesionales en nuestra plataforma institucional.</p>
                <p>Adjunto a esta comunicación encontrarán el documento oficial para su revisión y formalización.</p>
                <div class="alert-box">
                    <strong>Hoja de Ruta:</strong><br>
                    1. Descargue el PDF adjunto.<br>
                    2. Proceda con la firma electrónica o física.<br>
                    3. Cargue el documento firmado en el portal de convenios.
                </div>
            `;
            const html = this.getHtmlTemplate('Notificación de Convenio', content, 'Ir al Portal de Empresas', `${this.getPublicAppBase()}/login`);

            const info = await this.transporter.sendMail({
                from: `"Coordinación ISTPET" <${this.configService.get<string>('MAIL_USER')}>`,
                to: email,
                subject,
                html,
                attachments: [{
                    filename: 'Convenio_ISTPET.pdf',
                    path: filePath.startsWith('http') ? filePath : require('path').join(process.cwd(), filePath),
                }]
            });
            await this.logEmail(email, subject, 'EXITO', null, metadata);
            return { success: true, messageId: info.messageId };
        } catch (err: any) {
            await this.logEmail(email, subject, 'FALLIDO', err.message, metadata);
            return { success: false, error: err.message };
        }
    }

    async sendAssignmentEmail(email: string, studentName: string, companyName: string, startDate: string, hours: number, location: string, businessTutorName?: string, excelBuffer?: Buffer) {
        const subject = 'Asignación de Prácticas Preprofesionales - ISTPET';
        try {
            const content = `
                <p>Hola <span class="highlight">${studentName}</span>,</p>
                <p>Se te ha asignado formalmente para iniciar tu periodo de <span class="highlight">Vinculación con la Sociedad / Prácticas Preprofesionales</span>.</p>
                <div class="alert-box">
                    <strong>Detalles de Asignación:</strong><br>
                    • Empresa: ${companyName}<br>
                    • Ubicación: ${location}<br>
                    • Fecha Inicio: ${new Date(startDate).toLocaleDateString()}<br>
                    • Carga Horaria: ${hours} horas<br>
                    ${businessTutorName ? `• Tutor Empresarial: ${businessTutorName}` : ''}
                </div>
                <p>Adjunto encontrarás el archivo de control administrativo. Por favor, comunícate con tu tutor académico para el inicio del proceso.</p>
            `;
            const html = this.getHtmlTemplate('Nueva Asignación', content, 'Ver Expediente', `${this.getPublicAppBase()}/dashboard/documentos`);

            const info = await this.transporter.sendMail({
                from: `"Coordinación ISTPET" <${this.configService.get<string>('MAIL_USER')}>`,
                to: email,
                subject,
                html,
                attachments: excelBuffer ? [{ filename: 'Datos_Asignacion.xlsx', content: excelBuffer }] : []
            });
            await this.logEmail(email, subject, 'EXITO', null, { studentName, type: 'ASSIGNMENT' });
            return { success: true, messageId: info.messageId };
        } catch (err: any) {
            await this.logEmail(email, subject, 'FALLIDO', err.message, { studentName });
            return { success: false, error: err.message };
        }
    }

    async sendDocumentNotificationToTutor(email: string, studentName: string, documentName: string, isLate = false) {
        const subject = `${isLate ? 'ENTREGA TARDÍA: ' : 'Nueva Entrega: '}${documentName} - ${studentName}`;
        try {
            const content = `
                <p>Se ha recibido una nueva entrega documental pendiente de revisión académica.</p>
                <p>El estudiante <span class="highlight">${studentName}</span> ha cargado el documento <span class="highlight">${documentName}</span> al sistema.</p>
                ${isLate ? `
                <div class="alert-box" style="border-left-color: #d32f2f">
                    <strong>Aviso de Plazo:</strong> Este documento ha sido entregado fuera de la fecha límite establecida. Por favor, revise la validez del mismo según el reglamento de vinculación.
                </div>` : ''}
                <p>Por favor, acceda al portal administrativo para emitir la validación correspondiente.</p>
            `;
            const html = this.getHtmlTemplate(isLate ? 'Entrega Extemporánea' : 'Documento en Revisión', content, 'Revisar Ahora', `${this.getPublicAppBase()}/tutor-academico/asistencia`, isLate ? 'WARNING' : 'INFO');

            const info = await this.transporter.sendMail({
                from: `"Sistema EmiTesis" <${this.configService.get<string>('MAIL_USER')}>`,
                to: email,
                subject,
                html
            });
            return { success: true, messageId: info.messageId };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }

    async sendCoordinatorReviewResult(studentEmail: string, tutorEmail: string, studentName: string, documentName: string, status: string, observations: string) {
        const isApproved = status === 'APROBADO_DEFINITIVO';
        const subject = `Validación Definitiva: ${documentName}`;
        try {
            const content = `
                <p>La Coordinación de Vinculación ha finalizado la revisión definitiva del documento <span class="highlight">${documentName}</span> del estudiante <span class="highlight">${studentName}</span>.</p>
                <div class="alert-box" style="border-left-color: ${isApproved ? '#2e7d32' : '#d32f2f'}">
                    <strong>Resolución:</strong> ${isApproved ? 'APROBACIÓN DEFINITIVA' : 'OBSERVACIONES COORDINACIÓN'}<br>
                    ${observations ? `<strong>Detalles:</strong> ${observations}` : ''}
                </div>
            `;
            const html = this.getHtmlTemplate('Resolución de Coordinación', content, 'Ir al Expediente', `${this.getPublicAppBase()}/dashboard/documentos`, isApproved ? 'SUCCESS' : 'ERROR');

            await this.transporter.sendMail({
                from: `"Coordinación ISTPET" <${this.configService.get<string>('MAIL_USER')}>`,
                to: `${studentEmail}, ${tutorEmail}`,
                subject,
                html
            });
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }

    async sendDeadlineReminder(email: string, studentName: string, documentName: string, dueDate: Date) {
        const subject = `Recordatorio de Plazo: ${documentName}`;
        try {
            const content = `
                <p>Hola <span class="highlight">${studentName}</span>,</p>
                <p>Este es un recordatorio automático de que el plazo para la entrega del documento <span class="highlight">${documentName}</span> está próximo a vencer.</p>
                <div class="alert-box" style="border-left-color: #C5A059">
                    <strong>Fecha Límite:</strong> ${dueDate.toLocaleDateString()}<br>
                    <strong>Hora Límite:</strong> 23:59
                </div>
                <p>Por favor, asegúrese de cargar el documento firmado en el portal antes de la fecha indicada para evitar marcas de entrega tardía o incumplimiento.</p>
            `;
            const html = this.getHtmlTemplate('Recordatorio de Entrega', content, 'Cargar Documento', `${this.getPublicAppBase()}/dashboard/documentos`, 'WARNING');

            await this.transporter.sendMail({
                from: `"Gestión Académica ISTPET" <${this.configService.get<string>('MAIL_USER')}>`,
                to: email,
                subject,
                html
            });
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }

    async sendDocumentReviewResultToStudent(email: string, studentName: string, documentName: string, status: string, observations: string) {
        const isApproved = status === 'APROBADO_TUTOR' || status === 'APROBADO_DEFINITIVO';
        const subject = `Resultado de Revisión: ${documentName}`;
        try {
            const content = `
                <p>Tu tutor académico ha finalizado la revisión del documento <span class="highlight">${documentName}</span>.</p>
                <div class="alert-box" style="border-left-color: ${isApproved ? '#2e7d32' : '#d32f2f'}">
                    <strong>Resultado:</strong> ${isApproved ? 'Aprobado académicamente' : 'Corrección Requerida'}<br>
                    ${observations ? `<strong>Observaciones:</strong> ${observations}` : ''}
                </div>
                ${!isApproved ? '<p>Por favor, realice las correcciones indicadas y vuelva a cargar el documento para una nueva revisión.</p>' : ''}
            `;
            const html = this.getHtmlTemplate('Notificación de Revisión', content, 'Ver Detalles', `${this.getPublicAppBase()}/dashboard/documentos`, isApproved ? 'SUCCESS' : 'ERROR');

            await this.transporter.sendMail({
                from: `"Sistema EmiTesis" <${this.configService.get<string>('MAIL_USER')}>`,
                to: email,
                subject,
                html
            });
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }

    async sendCertificateNotification(email: string, studentName: string, downloadUrl: string) {
        const subject = 'Tu Certificado de Prácticas está listo - ISTPET';
        try {
            const content = `
                <p>¡Muchas felicidades <span class="highlight">${studentName}</span>!</p>
                <p>Has culminado exitosamente tu proceso de prácticas preprofesionales y vinculación.</p>
                <p>Tu <span class="highlight">Certificado de Culminación</span> ha sido generado con firma electrónica y cuenta con plena validez institucional para sus trámites de graduación.</p>
            `;
            const html = this.getHtmlTemplate('Certificación Generada', content, 'Descargar Certificado', downloadUrl, 'SUCCESS');

            await this.transporter.sendMail({
                from: `"Sistema EmiTesis" <${this.configService.get<string>('MAIL_USER')}>`,
                to: email,
                subject,
                html
            });
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }

    async generateAssignmentExcelBuffer(data: {
        studentName: string;
        companyName: string;
        location: string;
        hours: number;
        tutorName: string;
        startDate: string;
        businessTutorName?: string;
    }): Promise<Buffer> {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Asignación');

        worksheet.columns = [
            { header: 'Estudiante', key: 'student', width: 30 },
            { header: 'Empresa', key: 'company', width: 30 },
            { header: 'Dirección de Prácticas', key: 'location', width: 40 },
            { header: 'Horas', key: 'hours', width: 10 },
            { header: 'Tutor Académico', key: 'tutor', width: 30 },
            { header: 'Tutor Empresarial', key: 'businessTutor', width: 30 },
            { header: 'Fecha Inicio', key: 'start', width: 15 },
        ];

        worksheet.addRow({
            student: data.studentName,
            company: data.companyName,
            location: data.location,
            hours: data.hours,
            tutor: data.tutorName,
            businessTutor: data.businessTutorName || '—',
            start: new Date(data.startDate).toLocaleDateString(),
        });

        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF003366' },
        };

        return workbook.xlsx.writeBuffer() as unknown as Promise<Buffer>;
    }

    async sendTutorAssignmentEmail(email: string, tutorName: string, studentName: string, companyName: string, startDate: string, hours: number, businessTutorName?: string, excelBuffer?: Buffer) {
        const subject = `Asignación de Tutoría Académica: ${studentName}`;
        try {
            const content = `
                <p>Estimado/a <span class="highlight">${tutorName}</span>,</p>
                <p>Se le ha designado oficialmente como <span class="highlight">Tutor Académico</span> para el seguimiento de la práctica preprofesional del estudiante <span class="highlight">${studentName}</span>.</p>
                <div class="alert-box">
                    <strong>Hoja de Seguimiento:</strong><br>
                    • Estudiante: ${studentName}<br>
                    • Entidad: ${companyName}<br>
                    • Inicio: ${new Date(startDate).toLocaleDateString()}<br>
                    • Horas: ${hours}<br>
                </div>
                <p>Su función implica la validación de reportes mensuales y la evaluación final del proceso. Adjunto encontrará el archivo excel de asignación.</p>
            `;
            const html = this.getHtmlTemplate('Nueva Designación de Tutoría', content, 'Acceder al Panel', `${this.getPublicAppBase()}/tutor-academico/dashboard`);

            await this.transporter.sendMail({
                from: `"Coordinación ISTPET" <${this.configService.get<string>('MAIL_USER')}>`,
                to: email,
                subject,
                html,
                attachments: excelBuffer ? [{ filename: 'Seguimiento_Tutor.xlsx', content: excelBuffer }] : []
            });
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }

    async sendIncumplimientoAlertToTutor(email: string, tutorName: string, studentName: string, documentName: string) {
        const subject = `ALERTA DE INCUMPLIMIENTO: ${documentName} - ${studentName}`;
        try {
            const content = `
                <p>Estimado/a <span class="highlight">${tutorName}</span>,</p>
                <p>Se le informa que el plazo de entrega para el documento <span class="highlight">${documentName}</span> ha vencido sin que el estudiante <span class="highlight">${studentName}</span> haya realizado la carga correspondiente.</p>
                <div class="alert-box" style="border-left-color: #d32f2f">
                    <strong>Acción Automática:</strong> El documento ha sido marcado como <span style="color: #d32f2f; font-weight: 800;">INCUMPLIDO</span> en el sistema.
                </div>
                <p>Por favor, coordine con el estudiante para verificar los motivos del retraso o proceda según lo estipulado en el reglamento de prácticas preprofesionales.</p>
            `;
            const html = this.getHtmlTemplate('Alerta de Incumplimiento', content, 'Ver Expediente', `${this.getPublicAppBase()}/tutor-academico/asistencia`, 'ERROR');

            await this.transporter.sendMail({
                from: `"Sistema EmiTesis" <${this.configService.get<string>('MAIL_USER')}>`,
                to: email,
                subject,
                html
            });
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }

    private async logEmail(to: string, subject: string, status: string, error: string | null, metadata: Prisma.InputJsonValue) {
        try {
            await this.prisma.emailLog.create({
                data: { to, subject, status, error, metadata: metadata ?? Prisma.JsonNull }
            });
        } catch (logErr: any) {
            this.logger.error('Error guardando log email:', (logErr).message);
        }
    }
}
