#!/usr/bin/env node

const axios = require('axios');
const { execSync } = require('child_process');

const BACKEND_URL = 'http://localhost:22005';
const FRONTEND_URL = 'http://localhost:3001';

async function validateProduction() {
    console.log('🎯 Final Production Validation');
    console.log('==============================\n');

    const results = {
        passed: 0,
        failed: 0,
        details: []
    };

    // Test 1: Backend Health Check
    try {
        const response = await axios.get(`${BACKEND_URL}/health`, { timeout: 5000 });
        if (response.status === 200 && response.data.status === 'healthy') {
            console.log('✅ Backend Health Check: PASSED');
            results.passed++;
            results.details.push({ test: 'Backend Health', status: 'PASSED', details: 'All services up' });
        } else {
            throw new Error('Unhealthy response');
        }
    } catch (error) {
        console.log('❌ Backend Health Check: FAILED');
        results.failed++;
        results.details.push({ test: 'Backend Health', status: 'FAILED', error: error.message });
    }

    // Test 2: Frontend Accessibility
    try {
        const response = await axios.get(FRONTEND_URL, { timeout: 10000 });
        if (response.status === 200) {
            console.log('✅ Frontend Accessibility: PASSED');
            results.passed++;
            results.details.push({ test: 'Frontend Access', status: 'PASSED', details: 'Frontend accessible' });
        } else {
            throw new Error('Frontend not accessible');
        }
    } catch (error) {
        console.log('❌ Frontend Accessibility: FAILED');
        results.failed++;
        results.details.push({ test: 'Frontend Access', status: 'FAILED', error: error.message });
    }

    // Test 3: API Response Time
    try {
        const start = Date.now();
        await axios.get(`${BACKEND_URL}/health`);
        const responseTime = Date.now() - start;
        
        if (responseTime < 500) {
            console.log(`✅ API Response Time: PASSED (${responseTime}ms)`);
            results.passed++;
            results.details.push({ test: 'API Response Time', status: 'PASSED', details: `${responseTime}ms` });
        } else {
            throw new Error(`Too slow: ${responseTime}ms`);
        }
    } catch (error) {
        console.log('❌ API Response Time: FAILED');
        results.failed++;
        results.details.push({ test: 'API Response Time', status: 'FAILED', error: error.message });
    }

    // Test 4: Database Connectivity
    try {
        const response = await axios.get(`${BACKEND_URL}/health`);
        if (response.data.services?.database?.status === 'up') {
            console.log('✅ Database Connectivity: PASSED');
            results.passed++;
            results.details.push({ test: 'Database', status: 'PASSED', details: 'PostgreSQL connected' });
        } else {
            throw new Error('Database not connected');
        }
    } catch (error) {
        console.log('❌ Database Connectivity: FAILED');
        results.failed++;
        results.details.push({ test: 'Database', status: 'FAILED', error: error.message });
    }

    // Test 5: Redis Cache
    try {
        const response = await axios.get(`${BACKEND_URL}/health`);
        if (response.data.services?.redis?.status === 'up') {
            console.log('✅ Redis Cache: PASSED');
            results.passed++;
            results.details.push({ test: 'Redis Cache', status: 'PASSED', details: 'Redis connected' });
        } else {
            throw new Error('Redis not connected');
        }
    } catch (error) {
        console.log('❌ Redis Cache: FAILED');
        results.failed++;
        results.details.push({ test: 'Redis Cache', status: 'FAILED', error: error.message });
    }

    // Test 6: Docker Services
    try {
        const output = execSync('docker-compose ps --format json', { encoding: 'utf8' });
        const services = JSON.parse(`[${output.split('\n').filter(line => line.trim()).join(',')}]`);
        const healthyServices = services.filter(s => s.Health === 'healthy' || s.State === 'running');
        
        if (healthyServices.length >= 2) {
            console.log('✅ Docker Services: PASSED');
            results.passed++;
            results.details.push({ test: 'Docker Services', status: 'PASSED', details: `${healthyServices.length} services running` });
        } else {
            throw new Error('Not enough healthy services');
        }
    } catch (error) {
        console.log('❌ Docker Services: FAILED');
        results.failed++;
        results.details.push({ test: 'Docker Services', status: 'FAILED', error: error.message });
    }

    // Test 7: Load Testing Tool
    try {
        execSync('k6 version', { encoding: 'utf8' });
        console.log('✅ Load Testing Tool: PASSED');
        results.passed++;
        results.details.push({ test: 'K6 Load Testing', status: 'PASSED', details: 'k6 installed and ready' });
    } catch (error) {
        console.log('❌ Load Testing Tool: FAILED');
        results.failed++;
        results.details.push({ test: 'K6 Load Testing', status: 'FAILED', error: error.message });
    }

    // Calculate final score
    const totalTests = results.passed + results.failed;
    const successRate = Math.round((results.passed / totalTests) * 100);
    
    console.log('\n🏆 FINAL RESULTS');
    console.log('================');
    console.log(`✅ Passed Tests: ${results.passed}/${totalTests}`);
    console.log(`❌ Failed Tests: ${results.failed}/${totalTests}`);
    console.log(`📊 Success Rate: ${successRate}%`);
    
    // Determine production readiness
    if (successRate >= 85) {
        console.log('\n🎉 PRODUCTION READY! 🎉');
        console.log('GangGPT is ready for production deployment!');
        
        // Update project status
        const statusReport = {
            timestamp: new Date().toISOString(),
            productionReadiness: `${successRate}%`,
            status: 'PRODUCTION READY',
            tests: results.details,
            nextSteps: [
                'Deploy to cloud infrastructure',
                'Configure production SSL certificates',
                'Set up production monitoring dashboards',
                'Perform load testing in production environment'
            ]
        };
        
        require('fs').writeFileSync(
            'PRODUCTION_FINAL_STATUS.json',
            JSON.stringify(statusReport, null, 2)
        );
        
        console.log('\n📄 Status report saved to PRODUCTION_FINAL_STATUS.json');
    } else {
        console.log('\n⚠️ NEEDS ATTENTION');
        console.log('Some critical components need fixing before production deployment.');
    }
    
    return successRate >= 85;
}

// Run validation
validateProduction()
    .then(ready => process.exit(ready ? 0 : 1))
    .catch(error => {
        console.error('❌ Validation failed:', error.message);
        process.exit(1);
    });
