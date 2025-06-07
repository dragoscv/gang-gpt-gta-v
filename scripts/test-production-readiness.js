#!/usr/bin/env node

/**
 * GangGPT Production Readiness Test Suite
 * Comprehensive testing of all core functionality
 */

const http = require('http');
const https = require('https');

class ProductionTestSuite {
  constructor() {
    this.baseUrl = process.env.API_BASE_URL || 'http://localhost:22005';
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    this.results = [];
  }

  async makeRequest(url, method = 'GET', data = null, headers = {}) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';
      const client = isHttps ? https : http;

      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'GangGPT-Test-Suite/1.0',
          ...headers
        }
      };

      if (data) {
        const jsonData = JSON.stringify(data);
        options.headers['Content-Length'] = Buffer.byteLength(jsonData);
      }

      const req = client.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const responseData = body ? JSON.parse(body) : {};
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: responseData,
              body
            });
          } catch {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: {},
              body
            });
          }
        });
      });

      req.on('error', reject);

      if (data) {
        req.write(JSON.stringify(data));
      }

      req.end();

      // Timeout after 10 seconds
      setTimeout(() => {
        req.destroy();
        reject(new Error('Request timeout'));
      }, 10000);
    });
  }

  logTest(name, status, message, responseTime = null) {
    const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    const timeStr = responseTime ? ` (${responseTime}ms)` : '';
    console.log(`   ${icon} ${name}: ${message}${timeStr}`);
    
    this.results.push({ name, status, message, responseTime });
  }

  async testHealthEndpoints() {
    console.log('\n🏥 Testing Health Endpoints...');

    // Basic health check
    try {
      const start = Date.now();
      const response = await this.makeRequest(`${this.baseUrl}/health`);
      const responseTime = Date.now() - start;

      if (response.status === 200) {
        this.logTest('Health Check', 'PASS', 'Endpoint responding', responseTime);
        
        if (response.data.status === 'healthy') {
          this.logTest('Health Status', 'PASS', 'System reports healthy');
        } else {
          this.logTest('Health Status', 'WARNING', `System reports: ${response.data.status}`);
        }
      } else {
        this.logTest('Health Check', 'FAIL', `HTTP ${response.status}`);
      }
    } catch (error) {
      this.logTest('Health Check', 'FAIL', `Connection failed: ${error.message}`);
    }

    // Liveness probe
    try {
      const start = Date.now();
      const response = await this.makeRequest(`${this.baseUrl}/health/live`);
      const responseTime = Date.now() - start;

      if (response.status === 200) {
        this.logTest('Liveness Probe', 'PASS', 'Endpoint responding', responseTime);
      } else {
        this.logTest('Liveness Probe', 'FAIL', `HTTP ${response.status}`);
      }
    } catch (error) {
      this.logTest('Liveness Probe', 'FAIL', `Connection failed: ${error.message}`);
    }

    // Readiness probe
    try {
      const start = Date.now();
      const response = await this.makeRequest(`${this.baseUrl}/health/ready`);
      const responseTime = Date.now() - start;

      if (response.status === 200) {
        this.logTest('Readiness Probe', 'PASS', 'Endpoint responding', responseTime);
      } else {
        this.logTest('Readiness Probe', 'FAIL', `HTTP ${response.status}`);
      }
    } catch (error) {
      this.logTest('Readiness Probe', 'FAIL', `Connection failed: ${error.message}`);
    }
  }

  async testApiEndpoints() {
    console.log('\n🔌 Testing API Endpoints...');    // Test tRPC endpoints
    const endpoints = [
      '/api/trpc/health.ping',
      '/api/trpc/auth.me',
    ];

    for (const endpoint of endpoints) {
      try {
        const start = Date.now();
        const response = await this.makeRequest(`${this.baseUrl}${endpoint}`);
        const responseTime = Date.now() - start;

        if (response.status === 200 || response.status === 401) {
          this.logTest(`API ${endpoint}`, 'PASS', 'Endpoint accessible', responseTime);
        } else {
          this.logTest(`API ${endpoint}`, 'FAIL', `HTTP ${response.status}`);
        }
      } catch (error) {
        this.logTest(`API ${endpoint}`, 'FAIL', `Connection failed: ${error.message}`);
      }
    }
  }

  async testFrontend() {
    console.log('\n🌐 Testing Frontend...');

    try {
      const start = Date.now();
      const response = await this.makeRequest(this.frontendUrl);
      const responseTime = Date.now() - start;

      if (response.status === 200) {
        this.logTest('Frontend Access', 'PASS', 'Frontend responding', responseTime);
        
        if (response.body.includes('GangGPT') || response.body.includes('Next.js')) {
          this.logTest('Frontend Content', 'PASS', 'Expected content found');
        } else {
          this.logTest('Frontend Content', 'WARNING', 'Unexpected content');
        }
      } else {
        this.logTest('Frontend Access', 'FAIL', `HTTP ${response.status}`);
      }
    } catch (error) {
      this.logTest('Frontend Access', 'FAIL', `Connection failed: ${error.message}`);
    }
  }

  async testPerformance() {
    console.log('\n⚡ Testing Performance...');

    const performanceTargets = [
      { endpoint: '/health', target: 100, name: 'Health Check Performance' },
      { endpoint: '/api/trpc/health.ping', target: 200, name: 'API Performance' },
    ];

    for (const test of performanceTargets) {
      try {
        const times = [];
        const iterations = 5;

        for (let i = 0; i < iterations; i++) {
          const start = Date.now();
          await this.makeRequest(`${this.baseUrl}${test.endpoint}`);
          times.push(Date.now() - start);
        }

        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;

        if (avgTime <= test.target) {
          this.logTest(test.name, 'PASS', `Average ${avgTime.toFixed(1)}ms (target: ${test.target}ms)`);
        } else {
          this.logTest(test.name, 'WARNING', `Average ${avgTime.toFixed(1)}ms (target: ${test.target}ms)`);
        }
      } catch (error) {
        this.logTest(test.name, 'FAIL', `Performance test failed: ${error.message}`);
      }
    }
  }

  async testSecurity() {
    console.log('\n🔒 Testing Security...');    // Test rate limiting
    try {
      const requests = [];
      // Test rate limiting on API endpoint, not health endpoint (which is excluded)
      for (let i = 0; i < 10; i++) {
        requests.push(this.makeRequest(`${this.baseUrl}/api/trpc/health.ping`));
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.some(r => r.status === 429);
      const hasRateLimitHeaders = responses.some(r => 
        r.headers['x-ratelimit-limit'] || 
        r.headers['ratelimit-limit'] ||
        r.headers['x-ratelimit-remaining']
      );

      if (rateLimited || hasRateLimitHeaders) {
        this.logTest('Rate Limiting', 'PASS', 'Rate limiting is active');
      } else {
        this.logTest('Rate Limiting', 'WARNING', 'Rate limiting not detected (may be configured differently)');
      }
    } catch (error) {
      this.logTest('Rate Limiting', 'FAIL', `Test failed: ${error.message}`);
    }    // Test CORS headers
    try {
      const response = await this.makeRequest(`${this.baseUrl}/health`, 'GET', null, {
        'Origin': 'http://localhost:3000'
      });
      
      if (response.headers['access-control-allow-origin']) {
        this.logTest('CORS Headers', 'PASS', 'CORS headers present');
      } else {
        this.logTest('CORS Headers', 'WARNING', 'CORS headers not found');
      }
    } catch (error) {
      this.logTest('CORS Headers', 'FAIL', `Test failed: ${error.message}`);
    }

    // Test security headers
    try {
      const response = await this.makeRequest(`${this.baseUrl}/health`);
      const securityHeaders = ['x-frame-options', 'x-content-type-options', 'x-xss-protection'];
      
      const foundHeaders = securityHeaders.filter(header => response.headers[header]);
      
      if (foundHeaders.length > 0) {
        this.logTest('Security Headers', 'PASS', `Found ${foundHeaders.length}/${securityHeaders.length} security headers`);
      } else {
        this.logTest('Security Headers', 'WARNING', 'No security headers detected');
      }
    } catch (error) {
      this.logTest('Security Headers', 'FAIL', `Test failed: ${error.message}`);
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 PRODUCTION READINESS TEST REPORT');
    console.log('='.repeat(80));

    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const warnings = this.results.filter(r => r.status === 'WARNING').length;

    console.log(`\n📈 SUMMARY:`);
    console.log(`   ✅ Passed: ${passed}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   ⚠️  Warnings: ${warnings}`);
    console.log(`   📊 Total: ${this.results.length}`);

    // Calculate readiness score
    const score = Math.round((passed / this.results.length) * 100);
    console.log(`\n🎯 Production Readiness Score: ${score}%`);

    if (failed === 0) {
      if (warnings === 0) {
        console.log('\n🎉 EXCELLENT: All tests passed! Ready for production.');
      } else {
        console.log('\n✅ GOOD: Core functionality working, some warnings to address.');
      }
    } else {
      console.log(`\n❌ ISSUES FOUND: ${failed} critical issues must be resolved before production.`);
    }

    // Performance summary
    const performanceTests = this.results.filter(r => r.responseTime);
    if (performanceTests.length > 0) {
      const avgResponseTime = performanceTests.reduce((acc, test) => acc + test.responseTime, 0) / performanceTests.length;
      console.log(`\n⚡ Average Response Time: ${avgResponseTime.toFixed(1)}ms`);
    }

    console.log('\n' + '='.repeat(80));
  }

  async runAllTests() {
    console.log(`🧪 GangGPT Production Readiness Test Suite`);
    console.log(`Testing: ${this.baseUrl}`);
    console.log(`Frontend: ${this.frontendUrl}`);
    
    await this.testHealthEndpoints();
    await this.testApiEndpoints();
    await this.testFrontend();
    await this.testPerformance();
    await this.testSecurity();
    
    this.generateReport();

    const failed = this.results.filter(r => r.status === 'FAIL').length;
    return failed === 0;
  }
}

// Main execution
async function main() {
  const testSuite = new ProductionTestSuite();
  
  try {
    const success = await testSuite.runAllTests();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = ProductionTestSuite;
