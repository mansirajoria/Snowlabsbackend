import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';
import serverless from 'serverless-http';
import { AppModule } from './app.module';

const server = express();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), { logger: false });
  app.setGlobalPrefix(process.env.API_PREFIX || 'api');
  await app.init();
}

bootstrap();

export const handler = serverless(server);
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';

export async function bootstrapServer() {
  const server = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
  await app.init();
  return server;
}

if (require.main === module) {
  bootstrapServer().then(server => {
    server.listen(process.env.PORT || 3000);
  });
}
