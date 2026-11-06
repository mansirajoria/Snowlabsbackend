require('./register-paths');

const { NestFactory } = require('@nestjs/core');
const { DocumentBuilder, SwaggerModule } = require('@nestjs/swagger');
const { AppModule } = require('../dist/app.module');
const { ExpressAdapter } = require('@nestjs/platform-express');
const swaggerAssetsPath = require('swagger-ui-dist/absolute-path.js')();
const express = require('express');

async function createServer() {
  console.info('[startup] Initializing Nest application');
  const server = express();
  server.use('/docs', express.static(swaggerAssetsPath));
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
    logger: ['error', 'warn', 'log'],
    cors: true,
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
  console.info('[startup] Nest application initialized');
  return server;
}

module.exports = { createServer };
