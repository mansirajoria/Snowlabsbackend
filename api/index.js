// Vercel serverless function wrapper
const { handler } = require('../dist/src/main.server');
module.exports = (req, res) => handler(req, res);
const serverless = require('serverless-http');
const { createServer } = require('./server');

let cachedServer;

module.exports = async (req, res) => {
  if (!cachedServer) {
    cachedServer = await createServer();
  }
  return cachedServer(req, res);
};
