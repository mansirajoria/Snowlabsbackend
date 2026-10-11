import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';
import { AppModule } from './app.module';

// Use require to avoid TypeScript missing type declarations for serverless-http
// eslint-disable-next-line @typescript-eslint/no-var-requires
const serverless = require('serverless-http');

const server = express();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), { logger: false });
  app.setGlobalPrefix(process.env.API_PREFIX || 'api');
  await app.init();
}

bootstrap();

export const handler = serverless(server);
