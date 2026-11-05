const path = require('path');
const { register } = require('tsconfig-paths');

register({
  baseUrl: path.resolve(__dirname, '../dist'),
  paths: {
    '@*': ['*'],
    '@access/*': ['access-management/*'],
    '@role_permissions/*': ['role-permissions/*'],
    '@students_lms/*': ['students-lms/*'],
    '@trainer_lms/*': ['trainer-lms/*'],
    'src/*': ['*'],
    '*': ['*'],
  },
});

const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');
const { ExpressAdapter } = require('@nestjs/platform-express');
const express = require('express');

async function createServer() {
  const server = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), { logger: false });
  await app.init();
  return server;
}

module.exports = { createServer };
