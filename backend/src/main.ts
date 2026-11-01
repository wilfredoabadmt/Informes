import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as express from 'express';
import * as path from 'path';
import * as fs from 'fs';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Prefijo global de API
  app.setGlobalPrefix('api/v1');

  // Validación estricta de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS habilitado para frontend
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Configuración de OpenAPI / Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Sistema Integral de Registro y Gestión de Maestros - Bolivia')
    .setDescription('API de Autenticación, Identidad Docente y Contexto Multi-Tenant')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  // Endpoint explícito de salud en /api/v1/health
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/api/v1/health', (_req: any, res: any) => {
    res.status(200).json({
      status: 'ok',
      service: 'Sistema Integral de Registro y Gestión de Maestros - Bolivia',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // Servir SPA Frontend si existe en frontend/dist
  const possiblePaths = [
    path.join(process.cwd(), 'frontend', 'dist'),
    path.join(process.cwd(), '..', 'frontend', 'dist'),
    path.join(__dirname, '..', '..', 'frontend', 'dist'),
  ];
  const frontendDist = possiblePaths.find((p) => fs.existsSync(p));

  if (frontendDist) {
    logger.log(`🎨 Servidor SPA montado desde: ${frontendDist}`);
    app.use(express.static(frontendDist));
    httpAdapter.get('*', (req: any, res: any, next: any) => {
      const p = req.path || req.url;
      if (p.startsWith('/api') || p.startsWith('/docs')) {
        return next();
      }
      res.sendFile(path.join(frontendDist, 'index.html'));
    });
  } else {
    // Endpoint raíz de salud por defecto si no hay frontend compilado
    httpAdapter.get('/', (_req: any, res: any) => {
      res.status(200).json({
        status: 'ok',
        service: 'Sistema Integral de Registro y Gestión de Maestros - Bolivia',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
      });
    });
  }

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  logger.log(`🚀 Servidor backend ejecutándose en: http://localhost:${port}/api/v1`);
  logger.log(`📚 Documentación OpenAPI / Swagger disponible en: http://localhost:${port}/docs`);
}

bootstrap();

