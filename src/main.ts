import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableCors();

  // Try loading a pre-generated OpenAPI JSON from possible docs locations.
  const candidates = [
    path.join(__dirname, '..', 'docs', 'OpenSwagger.json'),
    path.join(process.cwd(), 'src', 'docs', 'OpenSwagger.json'),
    path.join(process.cwd(), 'docs', 'OpenSwagger.json'),
  ];

  let swaggerDocument: any = null;
  for (const filePath of candidates) {
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        swaggerDocument = JSON.parse(content);
        break;
      }
    } catch (e) {
      // ignore and try next candidate
    }
  }

  if (!swaggerDocument) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Terrafy API')
      .setDescription('Terrafy server API documentation')
      .setVersion('1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
      .build();

    swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  }

  SwaggerModule.setup('api/docs', app, swaggerDocument);
  await app.listen(process.env.PORT ?? 3000, "0.0.0.0");
}
bootstrap();
