import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;
  const app = await NestFactory.create(AppModule, {
    logger: isProduction ? ['error', 'warn'] : ['error', 'warn', 'log'],
  });

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('EmiTesis API')
    .setDescription('Documentación interactiva del Sistema de Gestión de Prácticas Preprofesionales ISTPET')
    .setVersion('1.0')
    .addTag('Auth', 'Endpoints de autenticación y acceso')
    .addTag('Users', 'Gestión de usuarios del sistema')
    .addTag('Agreements', 'Gestión de convenios institucionales')
    .addTag('Internships', 'Gestión de solicitudes y procesos de prácticas')
    .addBearerAuth() // Soporte para JWT
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  app.enableCors();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe());
  
  if (process.env.VERCEL) {
    // On Vercel, we don't call listen, the handler is exported
    await app.init();
    return app.getHttpAdapter().getInstance();
  } else {
    const port = process.env.PORT ?? 5000;
    await app.listen(port);
    console.log(`Backend running on: http://localhost:${port}`);
  }
}

// For local running
if (!process.env.VERCEL) {
  bootstrap();
}

// Export for Vercel
export default async (req: any, res: any) => {
  const app = await bootstrap();
  app(req, res);
};
