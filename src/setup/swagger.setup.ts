import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication) {
  const configService = app.get(ConfigService);
  const nodeEnv = configService.get<string>('app.nodeEnv');

  const swaggerEnabled = configService.get<boolean>('app.swaggerEnabled');

  if (nodeEnv === 'production' && !swaggerEnabled) {
    return;
  }

  const config = new DocumentBuilder()
    .setTitle('NestJS Boilerplate API')
    .setDescription(
      'A production-ready NestJS boilerplate with JWT authentication (access + refresh token rotation), ' +
        'table-based RBAC (Role & Permission models), user management with profile and soft delete, ' +
        'and multi-environment configuration support.',
    )
    .setVersion('2.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
}
