import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { SanitizationPipe } from './common/security/sanitization.pipe';
import helmet from 'helmet';

import { json, urlencoded } from 'express';
import * as express from 'express';
import { join } from 'path';
import * as fs from 'fs';

async function bootstrap() {
  // Ajuste automático de DATABASE_URL si corre local fuera de Docker
  const isDocker = fs.existsSync('/.dockerenv');
  if (!isDocker) {
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('@db:5432')) {
      process.env.DATABASE_URL = process.env.DATABASE_URL.replace('@db:5432', '@127.0.0.1:5432');
      console.log(`\x1b[33m[Host-Local]\x1b[0m DATABASE_URL redirigida dinámicamente: ${process.env.DATABASE_URL}`);
    }
    if (process.env.DIRECT_URL && process.env.DIRECT_URL.includes('@db:5432')) {
      process.env.DIRECT_URL = process.env.DIRECT_URL.replace('@db:5432', '@127.0.0.1:5432');
    }
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const app = await NestFactory.create(AppModule, {
    logger: isProduction ? ['error', 'warn'] : ['error', 'warn', 'log'],
  });

  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  app.use((req: any, res: any, next: any) => {
    if (!isProduction) {
      console.log(`[Request] ${req.method} ${req.url} - Origin: ${req.headers.origin}`);
    }
    next();
  });

  const config = new DocumentBuilder()
    .setTitle('EmiTesis API')
    .setDescription('Documentación interactiva del Sistema de Gestión de Prácticas Preprofesionales ISTPET')
    .setVersion('1.0')
    .addTag('Auth', 'Endpoints de autenticación y acceso')
    .addTag('System logs', 'Registro de actividad del sistema (solo administrador)')
    .addTag('Users', 'Gestión de usuarios del sistema')
    .addTag('Agreements', 'Gestión de convenios institucionales')
    .addTag('Internships', 'Gestión de solicitudes y procesos de prácticas')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  app.use(helmet({
    contentSecurityPolicy: isProduction ? undefined : false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }));

  const corsOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  if (corsOrigins.length > 0) {
    app.enableCors({
      origin: corsOrigins,
      credentials: true,
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'x-2fa-code'],
    });
  } else {
    app.enableCors({
      origin: isProduction ? false : true,
      credentials: true,
    });
  }

  app.setGlobalPrefix('api');
  
  app.useGlobalPipes(
    new SanitizationPipe(),
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableShutdownHooks();

  const port = process.env.PORT ?? 5000;
  await app.listen(port);
  console.log(`Backend running on: http://localhost:${port}`);
}

bootstrap().catch((err: Error) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});