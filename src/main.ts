import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.WEB_URL,
    credentials: true,
  });

  app.use(cookieParser());

  app.enableVersioning({
    type: VersioningType.URI,
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Trazo API')
      .setDescription('API for Trazo')
      .setVersion('1.0')
      .build();
    const document = SwaggerModule.createDocument(app, config);

    document.tags = [
      { name: 'Auth', description: 'Operations about authentication' },
      { name: 'Admin', description: 'Operations about admin' },
      { name: 'Users', description: 'Operations about users' },
      { name: 'Rol', description: 'Operations about roles' },
      { name: 'Modules', description: 'Operations about modules' },
      { name: 'Permissions', description: 'Operations about permissions' },
      { name: 'Audit', description: 'Operations about audit' },
      { name: 'Business', description: 'Operations about the business' },
      { name: 'Quotation', description: 'Operations about quotations' },
      { name: 'Levels', description: 'Operations about levels' },
    ];

    SwaggerModule.setup('api', app, document);

    app.use(
      '/reference',
      apiReference({
        spec: {
          content: document,
        },
      }),
    );
  }

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
