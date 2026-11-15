'use strict';

const http = require('node:http');
const { calculateTotal } = require('./index');
const { version } = require('../package.json');
const { recordRequest, renderMetrics } = require('./metrics');

const PORT = Number(process.env.PORT || 3001);

const server = http.createServer((req, res) => {
  const route = ['/health', '/payments', '/metrics'].includes(req.url)
    ? req.url
    : '/not-found';

  function respond(status, contentType, body) {
    recordRequest(req.method, route, status);
    res.writeHead(status, { 'Content-Type': contentType });
    res.end(body);
  }

  if (req.method === 'GET' && req.url === '/metrics') {
    return respond(
      200,
      'text/plain; version=0.0.4; charset=utf-8',
      renderMetrics()
    );
  }

  if (req.method === 'GET' && req.url === '/health') {
    return respond(
      200,
      'application/json',
      JSON.stringify({ status: 'healthy', version })
    );
  }

  if (req.method === 'POST' && req.url === '/payments') {
    let body = '';

    req.on('data', chunk => {
      body += chunk;

      if (body.length > 1024 * 1024) {
        req.destroy();
      }
    });

    req.on('end', () => {
      try {
        const payment = JSON.parse(body);
        const total = calculateTotal(payment.amount, payment.fee || 0);

        return respond(
          200,
          'application/json',
          JSON.stringify({ total, version })
        );
      } catch (error) {
        return respond(
          400,
          'application/json',
          JSON.stringify({ error: error.message })
        );
      }
    });

    return;
  }

  return respond(
    404,
    'application/json',
    JSON.stringify({ error: 'Not found' })
  );
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`kk-payments ${version} listening on port ${PORT}`);
});
