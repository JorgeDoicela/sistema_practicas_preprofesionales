import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import * as nodemailer from 'nodemailer';

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
              <a href="https://sistema-practicas-preprofesionales.vercel.app/login"
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
            const resetLink = `https://sistema-practicas-preprofesionales.vercel.app/reset-password?token=${token}`;

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
        location: string
    ) {
        const subject = 'Información de Asignación de Prácticas Preprofesionales - ISTPET';
        const metadata = { studentName, companyName, type: 'ASSIGNMENT' };

        const mailOptions = {
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
            </ul>
          </div>
          <p>Por favor, ponte en contacto con tu tutor académico asignado para iniciar el proceso de inducción.</p>
          <p style="font-size: 12px; color: #777;">Este es un correo automático, por favor no respondas a este mensaje.</p>
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
            this.logger.error('Error enviando email de asignación:', (err).message);
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
            <a href="https://sistema-practicas-preprofesionales.vercel.app/admin/practicas"
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
            <a href="https://sistema-practicas-preprofesionales.vercel.app/dashboard/documentos"
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
