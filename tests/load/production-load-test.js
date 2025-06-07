import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

export let errorRate = new Rate('errors');

export let options = {
  scenarios: {
    // Production load simulation
    production_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 },  // Ramp up
        { duration: '5m', target: 100 },  // Stay at 100 users
        { duration: '2m', target: 200 },  // Ramp to 200 users
        { duration: '5m', target: 200 },  // Stay at 200 users
        { duration: '2m', target: 500 },  // Ramp to 500 users
        { duration: '5m', target: 500 },  // Stay at 500 users
        { duration: '2m', target: 1000 }, // Ramp to 1000 users
        { duration: '5m', target: 1000 }, // Stay at 1000 users
        { duration: '5m', target: 0 },    // Ramp down
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<200'], // 95% of requests under 200ms
    http_req_failed: ['rate<0.01'],   // Error rate under 1%
    errors: ['rate<0.01'],            // Custom error rate under 1%
  },
};

const BASE_URL = 'http://localhost:22005';

export default function() {
  // Health check
  let healthResponse = http.get(`${BASE_URL}/api/health`);
  check(healthResponse, {
    'health check status 200': (r) => r.status === 200,
    'health check response time < 100ms': (r) => r.timings.duration < 100,
  }) || errorRate.add(1);

  // API endpoints
  let apiResponse = http.get(`${BASE_URL}/api/trpc/health.ping`);
  check(apiResponse, {
    'API status 200': (r) => r.status === 200,
    'API response time < 200ms': (r) => r.timings.duration < 200,
  }) || errorRate.add(1);

  // Simulate user behavior
  sleep(Math.random() * 2 + 1); // 1-3 seconds between requests
}

export function handleSummary(data) {
  return {
    'load-test-results.json': JSON.stringify(data, null, 2),
    'load-test-summary.html': htmlReport(data),
  };
}

function htmlReport(data) {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>GangGPT Load Test Results</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .metric { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 5px; }
        .pass { color: green; } .fail { color: red; }
    </style>
</head>
<body>
    <h1>🚀 GangGPT Load Test Results</h1>
    <div class="metric">
        <h3>Request Statistics</h3>
        <p>Total Requests: ${data.metrics.http_reqs.count}</p>
        <p>Average Response Time: ${data.metrics.http_req_duration.avg.toFixed(2)}ms</p>
        <p>95th Percentile: ${data.metrics.http_req_duration['p(95)'].toFixed(2)}ms</p>
        <p>Error Rate: ${(data.metrics.http_req_failed.rate * 100).toFixed(2)}%</p>
    </div>
    <div class="metric">
        <h3>Performance Thresholds</h3>
        <p class="${data.metrics.http_req_duration['p(95)'] < 200 ? 'pass' : 'fail'}">
            95th percentile < 200ms: ${data.metrics.http_req_duration['p(95)'].toFixed(2)}ms
        </p>
        <p class="${data.metrics.http_req_failed.rate < 0.01 ? 'pass' : 'fail'}">
            Error rate < 1%: ${(data.metrics.http_req_failed.rate * 100).toFixed(2)}%
        </p>
    </div>
</body>
</html>
`;
}