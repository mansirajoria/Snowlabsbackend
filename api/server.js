const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/src/app.module');
const { ExpressAdapter } = require('@nestjs/platform-express');
const express = require('express');

async function createServer() {
  const server = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), { logger: false });
  await app.init();
  return server;
}

module.exports = { createServer };
