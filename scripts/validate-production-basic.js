#!/usr/bin/env node

/**
 * Simple Production Configuration Validation Script
 * Checks critical production configurations and dependencies
 */

const dotenv = require('dotenv');
const fs = require('fs');

// Load production environment
dotenv.config({ path: '.env.production' });

console.log('🔍 Starting Production Configuration Validation...\n');

let passed = 0;
let failed = 0;
let warnings = 0;

function logResult(status, service, message) {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`   ${icon} ${message}`);
  
  if (status === 'PASS') passed++;
  else if (status === 'FAIL') failed++;
  else warnings++;
}

// Environment validation
console.log('📋 Validating Environment Variables...');

const requiredVars = [
  'NODE_ENV',
  'DATABASE_URL',
  'REDIS_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
];

for (const envVar of requiredVars) {
  const value = process.env[envVar];
  if (!value) {
    logResult('FAIL', 'Environment', `Missing required environment variable: ${envVar}`);
  } else if (value === 'your-secret-key' || value.includes('change-this') || value.includes('CHANGE_THIS')) {
    logResult('FAIL', 'Environment', `Default/insecure value for ${envVar}. Must be changed for production.`);
  } else {
    logResult('PASS', 'Environment', `${envVar} is properly configured`);
  }
}

// Check NODE_ENV
if (process.env.NODE_ENV !== 'production') {
  logResult('WARNING', 'Environment', `NODE_ENV is '${process.env.NODE_ENV}', should be 'production'`);
} else {
  logResult('PASS', 'Environment', 'NODE_ENV is set to production');
}

// File system validation
console.log('\n📁 Validating File System...');

const requiredDirs = ['./logs', './prisma'];
const requiredFiles = ['./prisma/schema.prisma', './package.json', './Dockerfile', './docker-compose.prod.yml'];

for (const dir of requiredDirs) {
  if (fs.existsSync(dir)) {
    logResult('PASS', 'File System', `Directory ${dir} exists`);
  } else {
    try {
      fs.mkdirSync(dir, { recursive: true });
      logResult('PASS', 'File System', `Created required directory: ${dir}`);
    } catch (error) {
      logResult('FAIL', 'File System', `Cannot create directory ${dir}: ${error.message}`);
    }
  }
}

for (const file of requiredFiles) {
  if (fs.existsSync(file)) {
    logResult('PASS', 'File System', `Required file exists: ${file}`);
  } else {
    logResult('FAIL', 'File System', `Required file missing: ${file}`);
  }
}

// Check if production secrets were generated
console.log('\n🔐 Validating Production Secrets...');

if (fs.existsSync('./production-secrets')) {
  logResult('PASS', 'Secrets', 'Production secrets directory exists');
  
  if (fs.existsSync('./production-secrets/.env.production.new')) {
    logResult('PASS', 'Secrets', 'Production environment template generated');
  } else {
    logResult('WARNING', 'Secrets', 'Production environment template not found');
  }
} else {
  logResult('WARNING', 'Secrets', 'Production secrets not generated. Run: node scripts/generate-production-secrets.js');
}

// Docker configuration
console.log('\n🐳 Validating Docker Configuration...');

if (fs.existsSync('./Dockerfile')) {
  logResult('PASS', 'Docker', 'Dockerfile exists');
} else {
  logResult('FAIL', 'Docker', 'Dockerfile missing');
}

if (fs.existsSync('./docker-compose.prod.yml')) {
  logResult('PASS', 'Docker', 'Production Docker Compose file exists');
} else {
  logResult('FAIL', 'Docker', 'Production Docker Compose file missing');
}

// Production readiness assessment
console.log('\n' + '='.repeat(80));
console.log('📊 PRODUCTION VALIDATION SUMMARY');
console.log('='.repeat(80));

console.log(`\n📈 RESULTS:`);
console.log(`   ✅ Passed: ${passed}`);
console.log(`   ❌ Failed: ${failed}`);
console.log(`   ⚠️  Warnings: ${warnings}`);
console.log(`   📊 Total: ${passed + failed + warnings}`);

console.log('\n' + '='.repeat(80));
if (failed === 0) {
  console.log('🎉 BASIC VALIDATION PASSED: Core configuration is ready!');
  if (warnings > 0) {
    console.log(`⚠️  Note: ${warnings} warnings should be addressed before deployment.`);
  }
} else {
  console.log(`❌ VALIDATION FAILED: ${failed} critical issues must be resolved.`);
}

console.log('\n🔍 Next Steps:');
console.log('   1. Fix any failed validations above');
console.log('   2. Update production secrets with real values');
console.log('   3. Configure Redis and PostgreSQL servers');
console.log('   4. Set up Azure OpenAI production API keys');
console.log('   5. Run full system tests');

console.log('='.repeat(80));

process.exit(failed > 0 ? 1 : 0);
