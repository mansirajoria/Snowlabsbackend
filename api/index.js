// Vercel serverless function wrapper
// Try to load a compiled serverless handler (several possible output paths),
// otherwise fall back to creating the server at runtime via `createServer()`.
const pathsToTry = [
	'../dist/main.server',
	'../dist/src/main.server',
	'../dist/src/main',
];

let compiledHandler = null;
for (const p of pathsToTry) {
	try {
		// eslint-disable-next-line global-require, import/no-dynamic-require
		const mod = require(p);
		if (mod && (mod.handler || mod.default)) {
			compiledHandler = mod.handler || mod.default;
			break;
		}
		// if module itself is a function
		if (typeof mod === 'function') {
			compiledHandler = mod;
			break;
		}
	} catch (err) {
		// ignore and try next
	}
}

const { createServer } = require('./server');

let cachedServer = null;

module.exports = async (req, res) => {
	try {
		if (compiledHandler) {
			// try calling the compiled handler with Express req/res
			return compiledHandler(req, res);
		}

		if (!cachedServer) {
			cachedServer = await createServer();
		}
		return cachedServer(req, res);
	} catch (err) {
		// log and return a clear 500 to help debugging on Vercel
		// eslint-disable-next-line no-console
		console.error('Server wrapper error:', err && err.stack ? err.stack : err);
		res.statusCode = 500;
		res.setHeader('content-type', 'text/plain; charset=utf-8');
		res.end('Internal Server Error: ' + (err && err.message ? err.message : 'unknown'));
	}
};
