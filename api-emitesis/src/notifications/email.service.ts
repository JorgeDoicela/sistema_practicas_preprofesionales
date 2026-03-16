import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.resend = new Resend(apiKey);
  }

  async sendWelcomeEmail(email: string, fullName: string) {
    try {
      this.logger.log(`Enviando email de bienvenida a: ${email}`);
      const { data, error } = await this.resend.emails.send({
        from: 'ISTPET <onboarding@resend.dev>', // Usar este dominio por defecto para pruebas
        to: [email],
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
      });

      if (error) {
        this.logger.error('Error de Resend:', error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (err) {
      this.logger.error('Error inesperado enviando email:', err.message);
      return { success: false, error: err.message };
    }
  }
}
