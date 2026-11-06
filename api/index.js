const { createServer } = require('./server');

let serverPromise;

module.exports = async (req, res) => {
  try {
    if (!serverPromise) {
      serverPromise = createServer();
    }

    const server = await serverPromise;
    return server(req, res);
  } catch (error) {
    serverPromise = undefined;
    console.error(
      'Vercel server initialization failed:',
      error && error.stack ? error.stack : error,
    );
    res.statusCode = 500;
    res.setHeader('content-type', 'text/plain; charset=utf-8');
    res.end('Internal Server Error');
  }
};
