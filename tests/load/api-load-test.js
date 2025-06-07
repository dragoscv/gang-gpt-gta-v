import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
export const errorRate = new Rate('errors');

export const options = {
  // Load test configuration
  stages: [
    { duration: '2m', target: 20 }, // Ramp up to 20 users
    { duration: '5m', target: 20 }, // Stay at 20 users
    { duration: '2m', target: 50 }, // Ramp up to 50 users  
    { duration: '5m', target: 50 }, // Stay at 50 users
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '5m', target: 0 }, // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests must complete below 2s
    http_req_failed: ['rate<0.1'], // Error rate must be below 10%
    errors: ['rate<0.1'], // Custom error rate below 10%
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:22005';

export default function () {
  // Test health endpoint
  const healthResponse = http.get(`${BASE_URL}/api/health`);
  check(healthResponse, {
    'health status is 200': (r) => r.status === 200,
    'health response time < 500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);

  sleep(1);

  // Test tRPC health endpoint
  const trpcHealthResponse = http.get(`${BASE_URL}/api/trpc/health.ping`);
  check(trpcHealthResponse, {
    'tRPC health status is 200': (r) => r.status === 200,
    'tRPC health response time < 500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);

  sleep(1);

  // Test authentication endpoint (without credentials - should get 401)
  const authResponse = http.get(`${BASE_URL}/api/trpc/auth.me`);
  check(authResponse, {
    'auth endpoint responds': (r) => r.status === 401 || r.status === 200,
    'auth response time < 1000ms': (r) => r.timings.duration < 1000,
  }) || errorRate.add(1);

  sleep(2);

  // Test stats endpoint
  const statsResponse = http.get(`${BASE_URL}/api/trpc/stats.getAll`);
  check(statsResponse, {
    'stats endpoint responds': (r) => r.status === 200 || r.status === 401,
    'stats response time < 1000ms': (r) => r.timings.duration < 1000,
  }) || errorRate.add(1);

  sleep(2);
}
