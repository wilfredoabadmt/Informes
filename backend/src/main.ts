import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

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
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
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

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  logger.log(`🚀 Servidor backend ejecutándose en: http://localhost:${port}/api/v1`);
  logger.log(`📚 Documentación OpenAPI / Swagger disponible en: http://localhost:${port}/docs`);
}

bootstrap();

