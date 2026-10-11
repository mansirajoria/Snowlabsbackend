const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

async function createServer() {
  const server = express();
  const app = await NestFactory.create(AppModule, server, { logger: false });
  await app.init();
  return server;
}

module.exports = { createServer };
