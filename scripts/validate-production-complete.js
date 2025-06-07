#!/usr/bin/env node

/**
 * GangGPT Production Readiness Validator
 * Comprehensive validation for 100% production readiness
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Configuration
const config = {
  backendUrl: process.env.BACKEND_URL || 'http://localhost:22005',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  timeout: 10000,
  retries: 3,
};

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  total: 0,
  details: []
};

// Utility functions
const log = (message) => console.log(`\x1b[36m${message}\x1b[0m`);
const success = (message) => console.log(`\x1b[32m   ✅ ${message}\x1b[0m`);
const warning = (message) => console.log(`\x1b[33m   ⚠️ ${message}\x1b[0m`);
const error = (message) => console.log(`\x1b[31m   ❌ ${message}\x1b[0m`);

// HTTP request helper
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { timeout: config.timeout, ...options }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data, headers: res.headers }));
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.on('error', reject);
  });
}

// Test execution helper
async function runTest(name, testFunc) {
  results.total++;
  try {
    const startTime = Date.now();
    const result = await testFunc();
    const duration = Date.now() - startTime;
    
    if (result.status === 'pass') {
      results.passed++;
      success(`${name}: ${result.message} (${duration}ms)`);
    } else if (result.status === 'warn') {
      results.warnings++;
      warning(`${name}: ${result.message} (${duration}ms)`);
    } else {
      results.failed++;
      error(`${name}: ${result.message} (${duration}ms)`);
    }
    
    results.details.push({
      name,
      status: result.status,
      message: result.message,
      duration
    });
  } catch (err) {
    results.failed++;
    results.details.push({
      name,
      status: 'fail',
      message: err.message,
      duration: 0
    });
    error(`${name}: ${err.message}`);
  }
}

// Infrastructure Tests
async function testDatabaseConnection() {
  try {
    const response = await makeRequest(`${config.backendUrl}/api/health`);
    if (response.status === 200) {
      const data = JSON.parse(response.data);
      if (data.status === 'healthy' && data.checks?.database) {
        return { status: 'pass', message: 'Database connection healthy' };
      }
    }
    return { status: 'fail', message: 'Database connection failed' };
  } catch (err) {
    return { status: 'fail', message: `Database test error: ${err.message}` };
  }
}

async function testRedisConnection() {
  try {
    const response = await makeRequest(`${config.backendUrl}/api/health`);
    if (response.status === 200) {
      const data = JSON.parse(response.data);
      if (data.status === 'healthy' && data.checks?.redis) {
        return { status: 'pass', message: 'Redis connection healthy' };
      }
    }
    return { status: 'fail', message: 'Redis connection failed' };
  } catch (err) {
    return { status: 'fail', message: `Redis test error: ${err.message}` };
  }
}

async function testAIServiceConnection() {
  try {
    const response = await makeRequest(`${config.backendUrl}/api/health`);
    if (response.status === 200) {
      const data = JSON.parse(response.data);
      if (data.checks?.ai) {
        return { status: 'pass', message: 'AI service configuration valid' };
      }
    }
    return { status: 'warn', message: 'AI service status unclear' };
  } catch (err) {
    return { status: 'fail', message: `AI service test error: ${err.message}` };
  }
}

// API Endpoint Tests
async function testHealthEndpoints() {
  const endpoints = [
    '/api/health',
    '/api/health/liveness',
    '/api/health/readiness'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(`${config.backendUrl}${endpoint}`);
      if (response.status !== 200) {
        return { status: 'fail', message: `Health endpoint ${endpoint} returned ${response.status}` };
      }
    } catch (err) {
      return { status: 'fail', message: `Health endpoint ${endpoint} failed: ${err.message}` };
    }
  }
  
  return { status: 'pass', message: 'All health endpoints responding' };
}

async function testTRPCEndpoints() {
  const endpoints = [
    '/api/trpc/health.ping',
    '/api/trpc/auth.me',
    '/api/trpc/stats.getAll'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(`${config.backendUrl}${endpoint}`);
      if (response.status < 200 || response.status >= 500) {
        return { status: 'fail', message: `tRPC endpoint ${endpoint} returned ${response.status}` };
      }
    } catch (err) {
      return { status: 'fail', message: `tRPC endpoint ${endpoint} failed: ${err.message}` };
    }
  }
  
  return { status: 'pass', message: 'All tRPC endpoints accessible' };
}

// Frontend Tests
async function testFrontendAccess() {
  try {
    const response = await makeRequest(config.frontendUrl);
    if (response.status === 200 && response.data.includes('html')) {
      return { status: 'pass', message: 'Frontend accessible and rendering' };
    }
    return { status: 'fail', message: `Frontend returned ${response.status}` };
  } catch (err) {
    return { status: 'fail', message: `Frontend test error: ${err.message}` };
  }
}

async function testFrontendAPIs() {
  try {
    const response = await makeRequest(`${config.frontendUrl}/api/health`);
    if (response.status === 200) {
      return { status: 'pass', message: 'Frontend API routes working' };
    }
    return { status: 'fail', message: `Frontend API returned ${response.status}` };
  } catch (err) {
    return { status: 'fail', message: `Frontend API test error: ${err.message}` };
  }
}

// Security Tests
async function testSecurityHeaders() {
  try {
    const response = await makeRequest(`${config.backendUrl}/api/health`);
    const headers = response.headers;
    
    const requiredHeaders = [
      'x-frame-options',
      'x-content-type-options',
      'x-xss-protection'
    ];
    
    const missingHeaders = requiredHeaders.filter(header => !headers[header]);
    
    if (missingHeaders.length === 0) {
      return { status: 'pass', message: 'All security headers present' };
    } else if (missingHeaders.length <= 1) {
      return { status: 'warn', message: `Missing headers: ${missingHeaders.join(', ')}` };
    } else {
      return { status: 'fail', message: `Multiple security headers missing: ${missingHeaders.join(', ')}` };
    }
  } catch (err) {
    return { status: 'fail', message: `Security headers test error: ${err.message}` };
  }
}

async function testRateLimiting() {
  try {
    // Make multiple rapid requests to test rate limiting
    const requests = Array(10).fill().map(() => 
      makeRequest(`${config.backendUrl}/api/health`)
    );
    
    const responses = await Promise.all(requests);
    const rateLimited = responses.some(r => r.status === 429);
    
    if (rateLimited) {
      return { status: 'pass', message: 'Rate limiting active' };
    } else {
      return { status: 'warn', message: 'Rate limiting not detected (may be configured differently)' };
    }
  } catch (err) {
    return { status: 'warn', message: 'Rate limiting test inconclusive' };
  }
}

// Performance Tests
async function testPerformance() {
  try {
    const iterations = 5;
    const times = [];
    
    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      await makeRequest(`${config.backendUrl}/api/health`);
      times.push(Date.now() - startTime);
    }
    
    const avgTime = times.reduce((a, b) => a + b) / times.length;
    
    if (avgTime < 100) {
      return { status: 'pass', message: `Average response time: ${avgTime.toFixed(1)}ms (excellent)` };
    } else if (avgTime < 200) {
      return { status: 'pass', message: `Average response time: ${avgTime.toFixed(1)}ms (good)` };
    } else if (avgTime < 500) {
      return { status: 'warn', message: `Average response time: ${avgTime.toFixed(1)}ms (acceptable)` };
    } else {
      return { status: 'fail', message: `Average response time: ${avgTime.toFixed(1)}ms (too slow)` };
    }
  } catch (err) {
    return { status: 'fail', message: `Performance test error: ${err.message}` };
  }
}

// Configuration Tests
async function testEnvironmentVariables() {
  const requiredFiles = [
    '.env.production',
    'docker-compose.prod.yml',
    'k8s/backend-deployment.yaml',
    'k8s/frontend-deployment.yaml'
  ];
  
  const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
  
  if (missingFiles.length === 0) {
    return { status: 'pass', message: 'All configuration files present' };
  } else {
    return { status: 'fail', message: `Missing files: ${missingFiles.join(', ')}` };
  }
}

async function testSSLReadiness() {
  const sslFiles = [
    'nginx/nginx.conf',
    'nginx/conf.d/frontend.conf',
    'nginx/conf.d/backend.conf'
  ];
  
  const missingSslFiles = sslFiles.filter(file => !fs.existsSync(file));
  
  if (missingSslFiles.length === 0) {
    return { status: 'pass', message: 'SSL/Nginx configuration ready' };
  } else {
    return { status: 'warn', message: `SSL files missing: ${missingSslFiles.join(', ')}` };
  }
}

// Monitoring Tests
async function testMonitoringSetup() {
  const monitoringFiles = [
    'grafana/provisioning/datasources/prometheus.yml',
    'prometheus/prometheus.yml'
  ];
  
  const missingFiles = monitoringFiles.filter(file => !fs.existsSync(file));
  
  if (missingFiles.length === 0) {
    return { status: 'pass', message: 'Monitoring configuration ready' };
  } else {
    return { status: 'warn', message: `Monitoring files missing: ${missingFiles.join(', ')}` };
  }
}

// Main test runner
async function runAllTests() {
  console.log('🧪 GangGPT Production Readiness Validator 2.0');
  console.log(`Testing: ${config.backendUrl}`);
  console.log(`Frontend: ${config.frontendUrl}\n`);

  // Infrastructure Tests
  log('🏗️ Testing Infrastructure...');
  await runTest('Database Connection', testDatabaseConnection);
  await runTest('Redis Connection', testRedisConnection);
  await runTest('AI Service Connection', testAIServiceConnection);

  // API Tests
  log('\n🔌 Testing API Endpoints...');
  await runTest('Health Endpoints', testHealthEndpoints);
  await runTest('tRPC Endpoints', testTRPCEndpoints);

  // Frontend Tests
  log('\n🌐 Testing Frontend...');
  await runTest('Frontend Access', testFrontendAccess);
  await runTest('Frontend APIs', testFrontendAPIs);

  // Security Tests
  log('\n🔒 Testing Security...');
  await runTest('Security Headers', testSecurityHeaders);
  await runTest('Rate Limiting', testRateLimiting);

  // Performance Tests
  log('\n⚡ Testing Performance...');
  await runTest('Response Performance', testPerformance);

  // Configuration Tests
  log('\n⚙️ Testing Configuration...');
  await runTest('Environment Variables', testEnvironmentVariables);
  await runTest('SSL Readiness', testSSLReadiness);
  await runTest('Monitoring Setup', testMonitoringSetup);

  // Results Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 PRODUCTION READINESS VALIDATION REPORT');
  console.log('='.repeat(80));

  const successRate = Math.round((results.passed / results.total) * 100);
  const qualityScore = Math.round(((results.passed + results.warnings * 0.5) / results.total) * 100);

  console.log(`\n📈 SUMMARY:`);
  console.log(`   ✅ Passed: ${results.passed}`);
  console.log(`   ❌ Failed: ${results.failed}`);
  console.log(`   ⚠️  Warnings: ${results.warnings}`);
  console.log(`   📊 Total: ${results.total}`);

  console.log(`\n🎯 Production Readiness Score: ${qualityScore}%`);

  if (qualityScore >= 100) {
    console.log('\n🎉 EXCELLENT: 100% production ready! Deploy with confidence.');
  } else if (qualityScore >= 95) {
    console.log('\n✅ EXCELLENT: Nearly perfect! Minor optimizations remain.');
  } else if (qualityScore >= 90) {
    console.log('\n✅ GOOD: Production ready with minor improvements needed.');
  } else if (qualityScore >= 80) {
    console.log('\n⚠️  ACCEPTABLE: Requires attention before production deployment.');
  } else {
    console.log('\n❌ CRITICAL: Major issues must be resolved before deployment.');
  }

  console.log('\n' + '='.repeat(80));

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Execute the tests
runAllTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
