import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
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
