import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
export const errorRate = new Rate('errors');

export const options = {
  // Frontend stress test configuration
  stages: [
    { duration: '1m', target: 10 }, // Ramp up to 10 users
    { duration: '3m', target: 30 }, // Ramp up to 30 users
    { duration: '5m', target: 50 }, // Ramp up to 50 users
    { duration: '10m', target: 100 }, // Stress test with 100 users
    { duration: '5m', target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'], // 95% of requests must complete below 5s
    http_req_failed: ['rate<0.05'], // Error rate must be below 5%
    errors: ['rate<0.05'],
  },
};

const FRONTEND_URL = __ENV.FRONTEND_URL || 'http://localhost:3000';

export default function () {
  // Test homepage
  const homepageResponse = http.get(FRONTEND_URL);
  check(homepageResponse, {
    'homepage status is 200': (r) => r.status === 200,
    'homepage loads in reasonable time': (r) => r.timings.duration < 3000,
    'homepage contains expected content': (r) => r.body.includes('GangGPT') || r.body.includes('html'),
  }) || errorRate.add(1);

  sleep(2);

  // Test API routes through frontend
  const apiHealthResponse = http.get(`${FRONTEND_URL}/api/health`);
  check(apiHealthResponse, {
    'frontend API health status is 200': (r) => r.status === 200,
    'frontend API response time < 1000ms': (r) => r.timings.duration < 1000,
  }) || errorRate.add(1);

  sleep(1);

  // Test static assets (if any)
  const faviconResponse = http.get(`${FRONTEND_URL}/favicon.ico`);
  check(faviconResponse, {
    'favicon loads': (r) => r.status === 200 || r.status === 404, // 404 is acceptable for favicon
  });

  sleep(3);
}
