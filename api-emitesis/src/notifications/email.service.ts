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
        private prisma: PrismaService, // Inyectar Prisma para los logs
    ) {
        this.transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false, // true for 465, false for 587 (TLS)
            auth: {
                user: this.configService.get<string>('MAIL_USER'),
                pass: this.configService.get<string>('MAIL_PASS'),
            },
            tls: {
                rejectUnauthorized: false // Helps in some restricted environments
            }
        });

        // Verificar la conexión al iniciar el servicio
        this.transporter.verify((error, success) => {
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

    async sendWelcomeEmail(email: string, fullName: string) {
        try {
            this.logger.log(`Enviando email de bienvenida via Gmail a: ${email}`);
            const mailOptions = {
                from: `"ISTPET" <${this.configService.get<string>('MAIL_USER')}>`,
                to: email,
                subject: '¡Bienvenido al Sistema de Prácticas Preprofesionales ISTPET!',
                html: `
          <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #003366;">Bienvenido, ${fullName}</h1>
            </div>
            <p>Tu registro como empresa en el <strong>Sistema de Gestión de Prácticas Preprofesionales ISTPET</strong> ha sido exitoso.</p>
            <p>Ahora puedes acceder al portal para gestionar convenios y estudiantes.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${this.getPublicAppBase()}/login"
                 style="background-color: #003366; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Acceder al Portal
              </a>
            </div>
            <p style="font-size: 12px; color: #777;">Si no realizaste este registro, por favor ignora este correo.</p>
            <hr style="border: 0; border-top: 1px solid #eee;" />
            <p style="text-align: center; font-size: 12px; color: #999;">&copy; 2026 Instituto Superior Tecnológico "Mayor Pedro Traversari"</p>
          </div>
        `,
            };

            const info = await this.transporter.sendMail(mailOptions);
            this.logger.log('Email enviado exitosamente: ' + info.messageId);
            return { success: true, data: info };
        } catch (err: any) {
            this.logger.error('Error enviando email via Gmail:', (err).message);
            return { success: false, error: (err).message };
        }
    }

    async sendPasswordResetEmail(email: string, fullName: string, token: string) {
        try {
            this.logger.log(`Enviando email de recuperación a: ${email}`);
            const resetLink = `${this.getPublicAppBase()}/reset-password?token=${token}`;

            const mailOptions = {
                from: `"Soporte ISTPET" <${this.configService.get<string>('MAIL_USER')}>`,
                to: email,
                subject: 'Recuperación de Contraseña - Sistema ISTPET',
                html: `
          <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #003366;">Recuperación de Contraseña</h1>
            </div>
            <p>Hola, <strong>${fullName}</strong>.</p>
            <p>Has solicitado restablecer tu contraseña en el Sistema de Gestión de Prácticas Preprofesionales ISTPET.</p>
            <p>Para continuar, haz clic en el siguiente enlace:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}"
                 style="background-color: #C5A059; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Restablecer Contraseña
              </a>
            </div>
            <p>Este enlace expirará en 1 hora.</p>
            <p style="font-size: 12px; color: #777;">Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
            <hr style="border: 0; border-top: 1px solid #eee;" />
            <p style="text-align: center; font-size: 12px; color: #999;">&copy; 2026 Instituto Superior Tecnológico "Mayor Pedro Traversari"</p>
          </div>
        `,
            };

            const info = await this.transporter.sendMail(mailOptions);
            this.logger.log('Email de recuperación enviado: ' + info.messageId);
            return { success: true };
        } catch (err: any) {
            this.logger.error('Error enviando email de recuperación:', (err).message);
            return { success: false, error: (err).message };
        }
    }

    /**
     * Reenvía un correo electrónico basado en un log previo (útil para corregir envíos fallidos)
     */
    async resendEmail(logId: string) {
        const log = await this.prisma.emailLog.findUnique({ where: { id: logId } });
        if (!log) throw new Error('Log de email no encontrado');

        this.logger.log(`Reenviando email a ${log.to}: ${log.subject}`);

        const mailOptions = {
            from: `"Soporte ISTPET" <${this.configService.get<string>('MAIL_USER')}>`,
            to: log.to,
            subject: `[REENVÍO] ${log.subject}`,
            html: `
        <div style="background-color: #fff3cd; padding: 10px; border: 1px solid #ffeeba; color: #856404; margin-bottom: 20px; text-align: center;">
          Este es un reenvío manual solicitado por un administrador.
        </div>
        ${this.getContentForSubject(log.subject)}
      `,
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            await this.logEmail(log.to, log.subject, 'EXITO', null, log.metadata || {});
            return { success: true, messageId: info.messageId };
        } catch (err: any) {
            await this.logEmail(log.to, log.subject, 'FALLIDO', err.message, log.metadata || {});
            return { success: false, error: err.message };
        }
    }

    // Método auxiliar para reconstruir contenido basado en subject
    private getContentForSubject(subject: string): string {
        if (subject.includes('Bienvenido')) return '<p>Bienvenido al Sistema de Prácticas ISTPET. Por favor acceda al portal.</p>';
        if (subject.includes('Recuperación')) return '<p>Solicitaste un cambio de contraseña. Por favor usa el enlace enviado anteriormente.</p>';
        return '<p>Notificación administrativa del Sistema de Prácticas ISTPET.</p>';
    }

    /**
     * RF-CON-002: Notificar a empresa sobre convenio por correo
     * Incluye adjunto y reintentos automáticos
     */
    async sendAgreementNotification(email: string, companyName: string, filePath: string, metadata: Prisma.InputJsonValue = {}) {
        const subject = 'Nuevo Convenio de Prácticas Preprofesionales - ISTPET';
        const maxRetries = 3;
        let attempt = 0;
        let lastError = '';

        const mailOptions = {
            from: `"Coordinación de Prácticas ISTPET" <${this.configService.get<string>('MAIL_USER')}>`,
            to: email,
            subject: subject,
            html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #003366;">Nuevo Convenio de Prácticas</h1>
          </div>
          <p>Estimados representantes de <strong>${companyName}</strong>,</p>
          <p>Se ha generado un nuevo convenio de prácticas preprofesionales en nuestro sistema.</p>
          <p>Adjunto a este correo encontrarán el documento correspondiente para su revisión y firma.</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Próximos pasos:</strong></p>
            <ul style="margin: 10px 0 0 20px; padding: 0;">
              <li>Revisar el PDF adjunto.</li>
              <li>Imprimir y firmar el documento.</li>
              <li>Subir el documento firmado a través del portal de empresas.</li>
            </ul>
          </div>
          <p style="font-size: 12px; color: #777;">Si tiene alguna duda, por favor contacte con la coordinación de prácticas.</p>
          <hr style="border: 0; border-top: 1px solid #eee;" />
          <p style="text-align: center; font-size: 12px; color: #999;">&copy; 2026 Instituto Superior Tecnológico "Mayor Pedro Traversari"</p>
        </div>
      `,
            attachments: [
                {
                    filename: 'Convenio_ISTPET.pdf',
                    path: filePath.startsWith('http') ? filePath : require('path').join(process.cwd(), filePath),
                }
            ]
        };

        while (attempt < maxRetries) {
            try {
                attempt++;
                this.logger.log(`Intento ${attempt} de enviar convenio a: ${email}`);

                const info = await this.transporter.sendMail(mailOptions);

                // Registrar éxito en la BD
                await this.logEmail(email, subject, 'EXITO', null, metadata);

                this.logger.log(`Convenio enviado con éxito en el intento ${attempt}`);
                return { success: true, messageId: info.messageId };
            } catch (err: any) {
                lastError = (err).message;
                this.logger.warn(`Fallo intento ${attempt} de enviar convenio: ${lastError}`);

                if (attempt >= maxRetries) {
                    // Registrar fallo definitivo en la BD
                    await this.logEmail(email, subject, 'FALLIDO', lastError, metadata);
                    return { success: false, error: lastError };
                }

                // Esperar un poco antes del reintento (1s, 2s, 4s...)
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
            }
        }
    }

    /**
     * RF-ASG-001: Notificar a estudiante sobre asignación de prácticas
     */
    async sendAssignmentEmail(
        email: string,
        studentName: string,
        companyName: string,
        startDate: string,
        hours: number,
        location: string,
        businessTutorName?: string,
        excelBuffer?: Buffer
    ) {
        const subject = 'Información de Asignación de Prácticas Preprofesionales - ISTPET';
        const metadata = { studentName, companyName, type: 'ASSIGNMENT' };

        const mailOptions: any = {
            from: `"Coordinación de Prácticas ISTPET" <${this.configService.get<string>('MAIL_USER')}>`,
            to: email,
            subject: subject,
            html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #003366;">¡Tienes una nueva asignación!</h1>
          </div>
          <p>Hola <strong>${studentName}</strong>,</p>
          <p>Se te ha asignado formalmente para realizar tus prácticas preprofesionales.</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Detalles de la asignación:</strong></p>
            <ul style="margin: 10px 0 0 20px; padding: 0;">
              <li><strong>Empresa:</strong> ${companyName}</li>
              <li><strong>Fecha de Inicio:</strong> ${new Date(startDate).toLocaleDateString()}</li>
              <li><strong>Horas a cumplir:</strong> ${hours} horas</li>
              <li><strong>Ubicación:</strong> ${location}</li>
              ${businessTutorName ? `<li><strong>Tutor Empresarial:</strong> ${businessTutorName}</li>` : ''}
            </ul>
          </div>
          <p>Adjunto a este correo encontrarás un archivo Excel con los datos oficiales de tu asignación.</p>
          <p>Por favor, ponte en contacto con tu tutor académico asignado para iniciar el proceso de inducción.</p>
          <p style="font-size: 12px; color: #777;">Este es un correo automático, por favor no respondas a este mensaje.</p>
          <hr style="border: 0; border-top: 1px solid #eee;" />
          <p style="text-align: center; font-size: 12px; color: #999;">&copy; 2026 Instituto Superior Tecnológico "Mayor Pedro Traversari"</p>
        </div>
      `,
            attachments: excelBuffer ? [
                {
                    filename: 'Datos_Asignacion_Practicas.xlsx',
                    content: excelBuffer
                }
            ] : []
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            await this.logEmail(email, subject, 'EXITO', null, metadata);
            return { success: true, messageId: info.messageId };
        } catch (err: any) {
            this.logger.error('Error enviando email de asignación:', (err).message);
            await this.logEmail(email, subject, 'FALLIDO', (err).message, metadata);
            return { success: false, error: (err).message };
        }
    }

    /**
     * RF-ASG-002: Notificar a tutor académico sobre nueva carga tutorial
     */
    async sendTutorAssignmentEmail(
        email: string,
        tutorName: string,
        studentName: string,
        companyName: string,
        startDate: string,
        hours: number,
        businessTutorName?: string,
        excelBuffer?: Buffer
    ) {
        const subject = `Nueva Asignación de Tutoría: ${studentName} - ISTPET`;
        const metadata = { tutorName, studentName, companyName, type: 'TUTOR_ASSIGNMENT' };

        const mailOptions: any = {
            from: `"Coordinación de Prácticas ISTPET" <${this.configService.get<string>('MAIL_USER')}>`,
            to: email,
            subject: subject,
            html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #003366;">Nueva Carga de Tutoría</h1>
          </div>
          <p>Estimado(a) <strong>${tutorName}</strong>,</p>
          <p>Se le ha asignado como tutor académico para el siguiente estudiante:</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Detalles de la tutoría:</strong></p>
            <ul style="margin: 10px 0 0 20px; padding: 0;">
              <li><strong>Estudiante:</strong> ${studentName}</li>
              <li><strong>Empresa:</strong> ${companyName}</li>
              <li><strong>Fecha de Inicio:</strong> ${new Date(startDate).toLocaleDateString()}</li>
              <li><strong>Horas asignadas:</strong> ${hours} horas</li>
              ${businessTutorName ? `<li><strong>Tutor Empresarial (Contraparte):</strong> ${businessTutorName}</li>` : ''}
            </ul>
          </div>
          <p>Adjunto encontrará el archivo Excel con la información detallada para su control administrativo.</p>
          <p>Por favor, coordine con el estudiante el inicio del proceso de prácticas y la planificación de las visitas correspondientes.</p>
          <hr style="border: 0; border-top: 1px solid #eee;" />
          <p style="text-align: center; font-size: 12px; color: #999;">&copy; 2026 Instituto Superior Tecnológico "Mayor Pedro Traversari"</p>
        </div>
      `,
            attachments: excelBuffer ? [
                {
                    filename: 'Datos_Asignacion_Tutoría.xlsx',
                    content: excelBuffer
                }
            ] : []
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            await this.logEmail(email, subject, 'EXITO', null, metadata);
            return { success: true, messageId: info.messageId };
        } catch (err: any) {
            this.logger.error('Error enviando email de tutoría:', (err).message);
            await this.logEmail(email, subject, 'FALLIDO', (err).message, metadata);
            return { success: false, error: (err).message };
        }
    }

    async sendDocumentNotificationToTutor(email: string, studentName: string, documentName: string) {
        const subject = `Nueva Entrega: ${documentName} - ${studentName}`;
        const metadata = { studentName, documentName, type: 'DOCUMENT_REVIEW' };

        const mailOptions = {
            from: `"Sistema EmiTesis" <${this.configService.get<string>('MAIL_USER')}>`,
            to: email,
            subject: subject,
            html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #003366;">Entrega Pendiente de Revisión</h1>
          </div>
          <p>Hola,</p>
          <p>El estudiante <strong>${studentName}</strong> ha subido el documento <strong>${documentName}</strong> para su revisión.</p>
          <p>Por favor, acceda al portal para revisar el documento y emitir su validación.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${this.getPublicAppBase()}/admin/practicas"
               style="background-color: #003366; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Revisar en el Portal
            </a>
          </div>
          <hr style="border: 0; border-top: 1px solid #eee;" />
          <p style="text-align: center; font-size: 12px; color: #999;">&copy; 2026 Instituto Superior Tecnológico "Mayor Pedro Traversari"</p>
        </div>
      `
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            await this.logEmail(email, subject, 'EXITO', null, metadata);
            return { success: true, messageId: info.messageId };
        } catch (err: unknown) {
            this.logger.error('Error enviando notificación de documento:', (err as Error).message);
            await this.logEmail(email, subject, 'FALLIDO', (err as Error).message, metadata);
            return { success: false, error: (err as Error).message };
        }
    }

    async sendDocumentReviewResultToStudent(
        email: string,
        studentName: string,
        documentName: string,
        status: string,
        observations: string
    ) {
        const isApproved = status === 'APROBADO_TUTOR';
        const subject = `Resultado de Revisión: ${documentName} - ${isApproved ? 'Aprobado' : 'Rechazado'}`;
        const metadata = { studentName, documentName, status, type: 'DOCUMENT_REVIEW_RESULT' };

        const mailOptions = {
            from: `"Sistema EmiTesis" <${this.configService.get<string>('MAIL_USER')}>`,
            to: email,
            subject: subject,
            html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: ${isApproved ? '#2e7d32' : '#d32f2f'};">${isApproved ? 'Documento Aprobado' : 'Documento Rechazado'}</h1>
          </div>
          <p>Hola <strong>${studentName}</strong>,</p>
          <p>Tu documento <strong>${documentName}</strong> ha sido revisado por tu tutor académico.</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid ${isApproved ? '#2e7d32' : '#d32f2f'};">
            <p><strong>Resultado:</strong> ${isApproved ? 'Aprobado por tutor (Pendiente de Coordinador)' : 'Rechazado - Requiere corrección'}</p>
            ${observations ? `<p><strong>Observaciones:</strong> ${observations}</p>` : ''}
          </div>
          <p>Por favor, accede al portal para realizar las acciones correspondientes.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${this.getPublicAppBase()}/dashboard/documentos"
               style="background-color: #003366; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Ver en el Portal
            </a>
          </div>
          <hr style="border: 0; border-top: 1px solid #eee;" />
          <p style="text-align: center; font-size: 12px; color: #999;">&copy; 2026 Instituto Superior Tecnológico "Mayor Pedro Traversari"</p>
        </div>
      `
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            await this.logEmail(email, subject, 'EXITO', null, metadata);
            return { success: true, messageId: info.messageId };
        } catch (err: unknown) {
            this.logger.error('Error enviando resultado de revisión:', (err as Error).message);
            await this.logEmail(email, subject, 'FALLIDO', (err as Error).message, metadata);
            return { success: false, error: (err as Error).message };
        }
    }

    async sendCoordinatorReviewResult(
        studentEmail: string,
        tutorEmail: string,
        studentName: string,
        documentName: string,
        status: string,
        observations: string
    ) {
        const isApproved = status === 'APROBADO_DEFINITIVO';
        const subject = `Resultado Final de Revisión: ${documentName} - ${isApproved ? 'Aprobado Definitivo' : 'Rechazado por Coordinador'}`;
        const metadata = { studentName, documentName, status, type: 'COORDINATOR_REVIEW_RESULT' };

        const htmlContent = `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: ${isApproved ? '#2e7d32' : '#d32f2f'};">${isApproved ? 'Aprobación Definitiva' : 'Corrección Requerida por Coordinación'}</h1>
          </div>
          <p>Hola,</p>
          <p>El coordinador de prácticas ha realizado la revisión final del documento <strong>${documentName}</strong> para el estudiante <strong>${studentName}</strong>.</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid ${isApproved ? '#2e7d32' : '#d32f2f'};">
            <p><strong>Resultado Final:</strong> ${isApproved ? 'Aprobado Definitivo (Documento Bloqueado)' : 'Rechazado por Coordinador - Requiere nueva revisión'}</p>
            ${observations ? `<p><strong>Observaciones del Coordinador:</strong> ${observations}</p>` : ''}
          </div>
          ${!isApproved ? '<p style="color: #d32f2f; font-weight: bold;">Tutor y Estudiante: Por favor coordinen las correcciones necesarias para reiniciar el ciclo de aprobación.</p>' : ''}
          <div style="text-align: center; margin: 30px 0;">
            <a href="${this.getPublicAppBase()}/dashboard"
               style="background-color: #003366; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Acceder al Sistema
            </a>
          </div>
          <hr style="border: 0; border-top: 1px solid #eee;" />
          <p style="text-align: center; font-size: 12px; color: #999;">&copy; 2026 Instituto Superior Tecnológico "Mayor Pedro Traversari"</p>
        </div>
      `;

        const mailOptions = {
            from: `"Sistema EmiTesis" <${this.configService.get<string>('MAIL_USER')}>`,
            to: [studentEmail, tutorEmail],
            subject: subject,
            html: htmlContent
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            await this.logEmail(studentEmail, subject, 'EXITO', null, metadata);
            return { success: true, messageId: info.messageId };
        } catch (err: unknown) {
            this.logger.error('Error enviando resultado de revisión de coordinador:', (err as Error).message);
            await this.logEmail(studentEmail, subject, 'FALLIDO', (err as Error).message, metadata);
            return { success: false, error: (err as Error).message };
        }
    }

    async sendCertificateNotification(email: string, studentName: string, downloadUrl: string) {
        const subject = 'Tu Certificado de Prácticas Preprofesionales está listo - ISTPET';
        const metadata = { studentName, type: 'CERTIFICATE_READY' };
        const maxRetries = 3;
        let attempt = 0;

        const mailOptions = {
            from: `"Sistema EmiTesis ISTPET" <${this.configService.get<string>('MAIL_USER')}>`,
            to: email,
            subject: subject,
            html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #003366;">¡Felicidades, ${studentName}!</h1>
          </div>
          <p>Has completado exitosamente tu periodo de prácticas preprofesionales.</p>
          <p>Tu certificado oficial ha sido generado y está disponible para su descarga.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${downloadUrl}"
               style="background-color: #C5A059; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Descargar Certificado
            </a>
          </div>
          <p style="font-size: 12px; color: #777;">También puedes encontrar este documento en tu sección de "Documentos" dentro del portal.</p>
          <hr style="border: 0; border-top: 1px solid #eee;" />
          <p style="text-align: center; font-size: 12px; color: #999;">&copy; 2026 Instituto Superior Tecnológico "Mayor Pedro Traversari"</p>
        </div>
      `
        };

        while (attempt < maxRetries) {
            try {
                attempt++;
                const info = await this.transporter.sendMail(mailOptions);
                await this.logEmail(email, subject, 'EXITO', null, metadata);
                return { success: true, messageId: info.messageId };
            } catch (err: any) {
                if (attempt >= maxRetries) {
                    await this.logEmail(email, subject, 'FALLIDO', err.message, metadata);
                    return { success: false, error: err.message };
                }
                await new Promise(resolve => setTimeout(resolve, 1000 * 60 * 5)); // 5 min
            }
        }
    }

    /**
     * RF-09: Notificar al tutor cuando un documento es marcado como INCUMPLIDO (plazo vencido sin entrega)
     */
    async sendIncumplimientoAlertToTutor(
        tutorEmail: string,
        tutorName: string,
        studentName: string,
        documentName: string,
    ) {
        const subject = `INCUMPLIMIENTO: ${studentName} no entregó "${documentName}"`;
        const metadata = { tutorName, studentName, documentName, type: 'INCUMPLIMIENTO_ALERT' };

        const mailOptions = {
            from: `"Sistema EmiTesis ISTPET" <${this.configService.get<string>('MAIL_USER')}>`,
            to: tutorEmail,
            subject,
            html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 20px; background-color: #d32f2f; padding: 20px; border-radius: 8px;">
            <h1 style="color: #ffffff; margin: 0;">⚠ Alerta de Incumplimiento</h1>
          </div>
          <p>Estimado(a) <strong>${tutorName}</strong>,</p>
          <p>El sistema ha detectado que el estudiante <strong>${studentName}</strong> no entregó el documento requerido antes del plazo límite establecido.</p>
          <div style="background-color: #fdecea; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #d32f2f;">
            <p style="margin: 0;"><strong>Documento:</strong> ${documentName}</p>
            <p style="margin: 8px 0 0;"><strong>Estado:</strong> INCUMPLIDO</p>
            <p style="margin: 8px 0 0;"><strong>Estudiante:</strong> ${studentName}</p>
          </div>
          <p>El documento ha sido bloqueado automáticamente. Puede otorgar una nueva fecha límite desde el portal si lo considera pertinente.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${this.getPublicAppBase()}/dashboard/documentos"
               style="background-color: #003366; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Ir al Portal
            </a>
          </div>
          <hr style="border: 0; border-top: 1px solid #eee;" />
          <p style="text-align: center; font-size: 12px; color: #999;">&copy; 2026 Instituto Superior Tecnológico "Mayor Pedro Traversari"</p>
        </div>
      `,
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            await this.logEmail(tutorEmail, subject, 'EXITO', null, metadata);
            return { success: true, messageId: info.messageId };
        } catch (err: any) {
            this.logger.error('Error enviando alerta de incumplimiento:', err.message);
            await this.logEmail(tutorEmail, subject, 'FALLIDO', err.message, metadata);
            return { success: false, error: err.message };
        }
    }

    async sendDeadlineReminder(email: string, studentName: string, documentName: string, dueDate: Date) {
        const subject = `Recordatorio: Plazo de entrega de ${documentName} pronto a vencer`;
        const metadata = { studentName, documentName, type: 'DEADLINE_REMINDER' };

        const mailOptions = {
            from: `"Recordatorios EmiTesis" <${this.configService.get<string>('MAIL_USER')}>`,
            to: email,
            subject: subject,
            html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #d32f2f;">Recordatorio de Entrega</h1>
          </div>
          <p>Hola <strong>${studentName}</strong>,</p>
          <p>Te recordamos que el plazo para la entrega del documento <strong>${documentName}</strong> vence mañana, <strong>${dueDate.toLocaleDateString()}</strong>.</p>
          <p>Por favor, asegúrate de subir el documento firmado a tiempo para evitar retrasos en tu proceso de certificación.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${this.getPublicAppBase()}/dashboard/documentos"
               style="background-color: #003366; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Subir Documento
            </a>
          </div>
          <hr style="border: 0; border-top: 1px solid #eee;" />
          <p style="text-align: center; font-size: 12px; color: #999;">&copy; 2026 Instituto Superior Tecnológico "Mayor Pedro Traversari"</p>
        </div>
      `
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            await this.logEmail(email, subject, 'EXITO', null, metadata);
            return { success: true, messageId: info.messageId };
        } catch (err: any) {
            this.logger.error('Error enviando recordatorio:', err.message);
            await this.logEmail(email, subject, 'FALLIDO', err.message, metadata);
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

        // Styling
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' },
        };

        return workbook.xlsx.writeBuffer() as unknown as Promise<Buffer>;
    }

    // Método privado para registrar en la base de datos (RF-CON-002: Punto 4)
    private async logEmail(to: string, subject: string, status: string, error: string | null, metadata: Prisma.InputJsonValue) {
        try {
            await this.prisma.emailLog.create({
                data: {
                    to,
                    subject,
                    status,
                    error,
                    metadata: metadata ?? Prisma.JsonNull,
                }
            });
        } catch (logErr: any) {
            this.logger.error('Error guardando log de email en BD:', (logErr).message);
        }
    }
}
