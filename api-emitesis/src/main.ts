import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import type { INestApplication } from '@nestjs/common';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import helmet from 'helmet';

/** En Vercel no se debe crear Nest en cada petición (agota tiempo/memoria y provoca FUNCTION_INVOCATION_FAILED). */
let vercelExpressApp: unknown = null;
let vercelBootstrapPromise: Promise<unknown> | null = null;

async function createConfiguredApp(): Promise<INestApplication> {
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;
  const app = await NestFactory.create(AppModule, {
    logger: isProduction ? ['error', 'warn'] : ['error', 'warn', 'log'],
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

  const corsOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  if (corsOrigins.length > 0) {
    app.enableCors({
      origin: corsOrigins,
      credentials: true,
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    });
  } else {
    app.enableCors();
  }
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      forbidNonWhitelisted: false,
    }),
  );
  
  /** Security Hardening: Ocultar info del servidor y cabeceras seguras */
  app.use(helmet());

  /** Industrial Core: Estandarización de respuestas y errores */
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());
  
  /** Resilience: Permitir que el servidor cierre conexiones limpiamente */
  app.enableShutdownHooks();

  return app;
}

async function getVercelExpressHandler(): Promise<(req: unknown, res: unknown) => void> {
  if (vercelExpressApp != null && typeof vercelExpressApp === 'function') {
    return vercelExpressApp as (req: unknown, res: unknown) => void;
  }
  if (!vercelBootstrapPromise) {
    vercelBootstrapPromise = (async () => {
      const app = await createConfiguredApp();
      await app.init();
      const instance = app.getHttpAdapter().getInstance();
      vercelExpressApp = instance;
      return instance;
    })().catch((err: unknown) => {
      vercelBootstrapPromise = null;
      throw err;
    });
  }
  const instance = await vercelBootstrapPromise;
  if (typeof instance !== 'function') {
    throw new Error('Nest HTTP adapter did not expose an Express-like handler');
  }
  return instance as (req: unknown, res: unknown) => void;
}

async function bootstrapLocal() {
  const app = await createConfiguredApp();
  const port = process.env.PORT ?? 5000;
  await app.listen(port);
  console.log(`Backend running on: http://localhost:${port}`);
}

/**
 * En algunos entornos locales (Windows + herramientas de Vercel) puede existir
 * `VERCEL` como variable global, lo que impedía levantar el servidor local.
 * Solo tratamos como runtime serverless real cuando VERCEL=1.
 */
const isVercelRuntime = process.env.VERCEL === '1';

if (!isVercelRuntime) {
  bootstrapLocal().catch((err: Error) => {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  });
}

export default async (req: unknown, res: unknown) => {
  try {
    const handler = await getVercelExpressHandler();
    handler(req, res);
  } catch (err: unknown) {
    console.error('[Vercel handler] Fallo al arrancar o delegar la petición:', err);
    const r = res as {
      headersSent?: boolean;
      statusCode?: number;
      setHeader?: (n: string, v: string) => void;
      end?: (b: string) => void;
    };
    if (!r.headersSent && typeof r.setHeader === 'function' && typeof r.end === 'function') {
      r.statusCode = 500;
      r.setHeader('Content-Type', 'application/json; charset=utf-8');
      r.end(
        JSON.stringify({
          statusCode: 500,
          message: 'Error al inicializar la API en el servidor. Revise los logs de Vercel y DATABASE_URL.',
        }),
      );
    }
  }
};
