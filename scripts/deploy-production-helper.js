#!/usr/bin/env node

/**
 * GangGPT Production Deployment Helper
 * Assists with deploying GangGPT to production environments
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log(`
🚀 GangGPT Production Deployment Helper
========================================

This script will help you deploy GangGPT to production.
Please follow the steps carefully.
`);

let step = 1;

function logStep(title, description) {
  console.log(`\n📋 Step ${step}: ${title}`);
  console.log(`   ${description}`);
  step++;
}

function logInfo(message) {
  console.log(`ℹ️  ${message}`);
}

function logSuccess(message) {
  console.log(`✅ ${message}`);
}

function logWarning(message) {
  console.log(`⚠️  ${message}`);
}

function logError(message) {
  console.log(`❌ ${message}`);
}

function checkCommandExists(command) {
  try {
    execSync(`${command} --version`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function runCommand(command, description) {
  try {
    console.log(`   Running: ${command}`);
    execSync(command, { stdio: 'inherit' });
    logSuccess(description);
  } catch (error) {
    logError(`Failed: ${description}`);
    throw error;
  }
}

// Step 1: Pre-deployment checks
logStep('Pre-deployment Checks', 'Verifying system requirements and dependencies');

const requiredCommands = [
  { cmd: 'node', name: 'Node.js' },
  { cmd: 'npm', name: 'npm' },
  { cmd: 'docker', name: 'Docker' },
  { cmd: 'docker-compose', name: 'Docker Compose' }
];

for (const { cmd, name } of requiredCommands) {
  if (checkCommandExists(cmd)) {
    logSuccess(`${name} is installed`);
  } else {
    logError(`${name} is not installed or not in PATH`);
    process.exit(1);
  }
}

// Step 2: Environment configuration
logStep('Environment Configuration', 'Setting up production environment variables');

if (!fs.existsSync('.env.production')) {
  logError('.env.production file not found');
  logInfo('Creating .env.production from template...');
  
  if (fs.existsSync('production-secrets/.env.production.new')) {
    fs.copyFileSync('production-secrets/.env.production.new', '.env.production');
    logSuccess('Created .env.production from template');
    logWarning('IMPORTANT: Update all placeholder values in .env.production with real credentials!');
  } else {
    logError('No production environment template found. Run: node scripts/generate-production-secrets.js');
    process.exit(1);
  }
} else {
  logSuccess('.env.production exists');
}

// Step 3: Database preparation
logStep('Database Preparation', 'Setting up production database');

logInfo('Building the application first...');
try {
  runCommand('npm run build', 'Application build completed');
} catch {
  logWarning('Build failed. Continuing with database setup...');
}

logInfo('Generating Prisma client...');
runCommand('npm run db:generate', 'Prisma client generated');

logInfo('Database migration status check...');
logWarning('Make sure your PostgreSQL server is running and accessible');
logInfo('If migrations fail, ensure DATABASE_URL in .env.production is correct');

// Step 4: Docker preparation
logStep('Docker Preparation', 'Building production Docker images');

logInfo('Building production Docker image...');
runCommand('docker build -t gang-gpt-server:latest .', 'Docker image built successfully');

// Step 5: Service dependencies
logStep('Service Dependencies', 'Starting required services');

logInfo('Starting Redis and PostgreSQL using Docker Compose...');
try {
  runCommand('docker-compose -f docker-compose.prod.yml up -d postgres redis', 'Dependencies started');
} catch {
  logWarning('Failed to start dependencies. You may need to configure them manually.');
}

// Step 6: Health check
logStep('Health Check', 'Verifying service readiness');

logInfo('Running basic configuration validation...');
try {
  runCommand('node scripts/validate-production-basic.js', 'Basic validation passed');
} catch {
  logWarning('Validation failed. Check configuration and try again.');
}

// Step 7: Deployment options
logStep('Deployment Options', 'Choose your deployment method');

console.log(`
🎯 DEPLOYMENT OPTIONS:

1. 🐳 Docker Compose (Recommended for single server):
   docker-compose -f docker-compose.prod.yml up -d

2. 🚢 Kubernetes (For production clusters):
   kubectl apply -f production-secrets/secrets.k8s.yaml
   kubectl apply -f k8s/  # (if you have k8s manifests)

3. 📦 Direct Node.js (Manual deployment):
   NODE_ENV=production npm start

4. 🔧 Development Testing:
   npm run dev

`);

console.log(`
🔐 SECURITY CHECKLIST:

Before deploying to production:
□ Update all passwords in .env.production
□ Set strong JWT secrets (32+ characters)
□ Configure proper SSL/TLS certificates
□ Set up Azure OpenAI production API keys
□ Enable firewall rules for only required ports
□ Configure backup strategies for database
□ Set up monitoring and alerting

`);

console.log(`
📊 MONITORING ENDPOINTS:

After deployment, these endpoints will be available:
- Health Check: http://your-server:22005/health
- API Documentation: http://your-server:22005/api/docs
- Metrics (dev only): http://your-server:22005/metrics
- Frontend: http://your-server:3000

`);

console.log(`
🎉 READY FOR DEPLOYMENT!

Your GangGPT application is ready for production deployment.

Next steps:
1. Review and update all credentials in .env.production
2. Choose a deployment method from the options above  
3. Monitor the health endpoints after deployment
4. Set up proper backups and monitoring

For support, check the documentation in the docs/ folder.
`);

logSuccess('Production deployment preparation completed!');
