import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';
import { AppModule } from './app.module';

// Use require to avoid TypeScript missing type declarations for serverless-http
// eslint-disable-next-line @typescript-eslint/no-var-requires
const serverless = require('serverless-http');

const server = express();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
    cors: true,
    logger: false,
  });
  app.setGlobalPrefix(process.env.API_PREFIX || 'api');
  const options = new DocumentBuilder()
    .setTitle('SnowLabs Technology')
    .setDescription(
      'The swagger documents for all the API available in the SnowLabs Technology services.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('docs', app, document);
  await app.init();
}

bootstrap();

export const handler = serverless(server);
