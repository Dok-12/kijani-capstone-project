'use strict';

const requestCounts = new Map();

function recordRequest(method, route, status) {
  const key = `${method}|${route}|${status}`;
  requestCounts.set(key, (requestCounts.get(key) || 0) + 1);
}

function renderMetrics() {
  const lines = [
    '# HELP http_requests_total Total HTTP requests handled by kk-payments',
    '# TYPE http_requests_total counter'
  ];

  for (const [key, count] of requestCounts) {
    const [method, route, status] = key.split('|');

    lines.push(
      `http_requests_total{method="${method}",route="${route}",status="${status}"} ${count}`
    );
  }

  return `${lines.join('\n')}\n`;
}

module.exports = {
  recordRequest,
  renderMetrics
};
