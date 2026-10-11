// Vercel serverless function wrapper
// Exports the handler generated in the compiled `dist/main.server.js` file.
const { handler } = require('../dist/main.server');
module.exports = handler;
