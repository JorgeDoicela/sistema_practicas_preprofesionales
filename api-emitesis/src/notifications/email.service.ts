import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {
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
        this.logger.error('Error de configuración de Gmail:', error.message);
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
    } catch (err) {
      this.logger.error('Error enviando email via Gmail:', err.message);
      return { success: false, error: err.message };
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
    } catch (err) {
      this.logger.error('Error enviando email de recuperación:', err.message);
      return { success: false, error: err.message };
    }
  }
}
