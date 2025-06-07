#!/usr/bin/env node

/**
 * Production Secrets Generator
 * Generates secure secrets for production deployment
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class SecretsGenerator {
  /**
   * Generate a secure random string
   */
  generateSecret(length = 32) {
    return crypto.randomBytes(length).toString('base64').slice(0, length);
  }

  /**
   * Generate a secure password
   */
  generatePassword(length = 24) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }

  /**
   * Generate UUID
   */
  generateUUID() {
    return crypto.randomUUID();
  }

  /**
   * Generate all production secrets
   */
  generateAllSecrets() {
    return {
      // Database secrets
      POSTGRES_PASSWORD: this.generatePassword(32),

      // Redis secrets
      REDIS_PASSWORD: this.generatePassword(24),

      // JWT secrets
      JWT_SECRET: this.generateSecret(64),
      JWT_REFRESH_SECRET: this.generateSecret(64),

      // Monitoring secrets
      GRAFANA_ADMIN_PASSWORD: this.generatePassword(20),

      // Session secrets
      SESSION_SECRET: this.generateSecret(48),

      // API keys (placeholders - to be replaced with real values)
      AZURE_OPENAI_API_KEY: 'REPLACE_WITH_REAL_AZURE_OPENAI_API_KEY',
      AZURE_OPENAI_ENDPOINT: 'https://your-openai-instance.openai.azure.com/',

      // Email secrets (placeholders)
      SMTP_PASSWORD: 'REPLACE_WITH_REAL_SMTP_PASSWORD',

      // Additional security
      ENCRYPTION_KEY: this.generateSecret(32),
      API_KEY_SALT: this.generateSecret(16),
    };
  }

  /**
   * Create production environment file
   */
  createProductionEnv(secrets) {
    const envContent = `# Production Environment Configuration - Generated ${new Date().toISOString()}
# SECURITY NOTICE: Keep this file secure and never commit to version control

# Environment
NODE_ENV=production
PORT=3001
FRONTEND_PORT=3000

# Database Configuration
DATABASE_URL=postgresql://ganggpt:\${POSTGRES_PASSWORD}@postgres:5432/ganggpt_production
DATABASE_SSL=true
POSTGRES_USER=ganggpt
POSTGRES_DB=ganggpt_production
POSTGRES_PASSWORD=${secrets.POSTGRES_PASSWORD}

# Redis Configuration
REDIS_URL=redis://:\${REDIS_PASSWORD}@redis:6379
REDIS_PASSWORD=${secrets.REDIS_PASSWORD}

# Azure OpenAI Configuration (REPLACE WITH REAL VALUES)
AZURE_OPENAI_ENDPOINT=${secrets.AZURE_OPENAI_ENDPOINT}
AZURE_OPENAI_API_KEY=${secrets.AZURE_OPENAI_API_KEY}
AZURE_OPENAI_API_VERSION=2024-02-01
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o-mini

# JWT Configuration
JWT_SECRET=${secrets.JWT_SECRET}
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=${secrets.JWT_REFRESH_SECRET}
JWT_REFRESH_EXPIRES_IN=7d

# Session Configuration
SESSION_SECRET=${secrets.SESSION_SECRET}

# RAGE:MP Configuration
RAGEMP_NAME=GangGPT Server
RAGEMP_GAMEMODE=freeroam
RAGEMP_MAP=GangGPT
RAGEMP_PASSWORD=
RAGEMP_MAX_PLAYERS=1000
RAGEMP_ANNOUNCE=true
RAGEMP_SYNC_RATE=40

# Logging Configuration
LOG_LEVEL=info
LOG_FILE_ENABLED=true
LOG_FILE_PATH=./logs/gang-gpt.log

# Security Configuration
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=https://your-frontend-domain.com
ENCRYPTION_KEY=${secrets.ENCRYPTION_KEY}
API_KEY_SALT=${secrets.API_KEY_SALT}

# AI Configuration
AI_MAX_TOKENS=150
AI_TEMPERATURE=0.7
AI_MEMORY_RETENTION_DAYS=30
AI_MAX_CONCURRENT_REQUESTS=10

# Email Configuration (REPLACE WITH REAL VALUES)
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASSWORD=${secrets.SMTP_PASSWORD}
SMTP_FROM=noreply@your-domain.com
SMTP_FROM_NAME=GangGPT

# Monitoring Configuration
PROMETHEUS_ENABLED=true
PROMETHEUS_PORT=9090
GRAFANA_PORT=3005
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=${secrets.GRAFANA_ADMIN_PASSWORD}

# Feature Flags
ENABLE_AI_COMPANIONS=true
ENABLE_DYNAMIC_MISSIONS=true
ENABLE_FACTION_WARS=true
ENABLE_PLAYER_ANALYTICS=true
ENABLE_VOICE_CHAT_AI=false

# Additional Production Settings
HEALTH_CHECK_INTERVAL_MS=30000
DEBUG_MODE=false
MOCK_AI_RESPONSES=false
ENABLE_DEV_COMMANDS=false
`;

    return envContent;
  }

  /**
   * Create Docker secrets file
   */
  createDockerSecrets(secrets) {
    const dockerSecretsContent = `# Docker Secrets for Production
# Use with: docker-compose --env-file .env.docker.secrets -f docker-compose.prod.yml up

POSTGRES_PASSWORD=${secrets.POSTGRES_PASSWORD}
REDIS_PASSWORD=${secrets.REDIS_PASSWORD}
GRAFANA_ADMIN_PASSWORD=${secrets.GRAFANA_ADMIN_PASSWORD}
`;

    return dockerSecretsContent;
  }

  /**
   * Create Kubernetes secrets YAML
   */
  createKubernetesSecrets(secrets) {
    const k8sSecrets = {
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: {
        name: 'ganggpt-secrets',
        namespace: 'default',
      },
      type: 'Opaque',
      data: {
        'postgres-password': Buffer.from(secrets.POSTGRES_PASSWORD).toString('base64'),
        'redis-password': Buffer.from(secrets.REDIS_PASSWORD).toString('base64'),
        'jwt-secret': Buffer.from(secrets.JWT_SECRET).toString('base64'),
        'jwt-refresh-secret': Buffer.from(secrets.JWT_REFRESH_SECRET).toString('base64'),
        'grafana-admin-password': Buffer.from(secrets.GRAFANA_ADMIN_PASSWORD).toString('base64'),
        'session-secret': Buffer.from(secrets.SESSION_SECRET).toString('base64'),
        'encryption-key': Buffer.from(secrets.ENCRYPTION_KEY).toString('base64'),
      },
    };

    return `# Kubernetes Secrets for GangGPT
# Apply with: kubectl apply -f secrets.k8s.yaml
# Generated: ${new Date().toISOString()}

${JSON.stringify(k8sSecrets, null, 2)}
`;
  }

  /**
   * Create secrets documentation
   */
  createSecretsDoc(secrets) {
    const doc = `# Production Secrets Documentation

Generated: ${new Date().toISOString()}

## 🔐 Security Notice
This file contains sensitive information. Keep it secure and never commit to version control.

## 📋 Secrets Inventory

### Database Secrets
- **POSTGRES_PASSWORD**: PostgreSQL database password
- **DATABASE_URL**: Complete database connection string

### Cache Secrets
- **REDIS_PASSWORD**: Redis authentication password

### Authentication Secrets
- **JWT_SECRET**: JSON Web Token signing secret (64 chars)
- **JWT_REFRESH_SECRET**: Refresh token signing secret (64 chars)
- **SESSION_SECRET**: Session encryption secret (48 chars)

### Monitoring Secrets
- **GRAFANA_ADMIN_PASSWORD**: Grafana admin interface password

### Encryption Secrets
- **ENCRYPTION_KEY**: Application-level encryption key
- **API_KEY_SALT**: Salt for API key generation

### External Service Secrets (TO BE REPLACED)
- **AZURE_OPENAI_API_KEY**: Azure OpenAI service API key
- **SMTP_PASSWORD**: Email service password

## 🔄 Rotation Schedule
- JWT secrets: Every 90 days
- Database passwords: Every 180 days
- API keys: When compromised or annually
- Session secrets: Every 30 days

## 📊 Deployment Instructions

### Docker Deployment
1. Copy .env.production to your production server
2. Replace placeholder values with real credentials
3. Use .env.docker.secrets for Docker Compose secrets
4. Run: \`docker-compose --env-file .env.docker.secrets -f docker-compose.prod.yml up -d\`

### Kubernetes Deployment
1. Replace placeholder values in secrets.k8s.yaml
2. Apply secrets: \`kubectl apply -f secrets.k8s.yaml\`
3. Reference secrets in your deployment manifests

### Manual Setup
1. Set all environment variables in your deployment environment
2. Ensure proper file permissions (600) for secret files
3. Use a secure secret management system in production

## 🚨 Security Checklist
- [ ] All placeholder values replaced with real credentials
- [ ] Secrets stored in secure secret management system
- [ ] File permissions set to 600 (owner read/write only)
- [ ] Secrets excluded from version control
- [ ] Backup and recovery plan for secrets
- [ ] Regular rotation schedule implemented
- [ ] Access logging enabled for secret retrieval

## 📞 Emergency Contacts
In case of security breach:
1. Immediately rotate all compromised secrets
2. Check access logs for unauthorized usage
3. Notify security team
4. Update all affected systems

## 🔍 Validation
Run the production validation script to verify all secrets are working:
\`\`\`bash
npm run validate:production
\`\`\`
`;

    return doc;
  }

  /**
   * Generate all production files
   */
  async generateProductionFiles() {
    console.log('🔐 Generating production secrets...\n');

    const secrets = this.generateAllSecrets();

    // Create output directory
    const outputDir = path.join(process.cwd(), 'production-secrets');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate files
    const files = [
      {
        name: '.env.production.new',
        content: this.createProductionEnv(secrets),
        description: 'Production environment file',
      },
      {
        name: '.env.docker.secrets',
        content: this.createDockerSecrets(secrets),
        description: 'Docker secrets file',
      },
      {
        name: 'secrets.k8s.yaml',
        content: this.createKubernetesSecrets(secrets),
        description: 'Kubernetes secrets manifest',
      },
      {
        name: 'SECRETS_README.md',
        content: this.createSecretsDoc(secrets),
        description: 'Secrets documentation',
      },
    ];

    // Write files
    for (const file of files) {
      const filePath = path.join(outputDir, file.name);
      fs.writeFileSync(filePath, file.content);

      // Set secure permissions (Unix/Linux)
      if (process.platform !== 'win32' && file.name.includes('secret')) {
        try {
          fs.chmodSync(filePath, 0o600);
        } catch (error) {
          console.log(`⚠️  Could not set secure permissions for ${file.name}`);
        }
      }

      console.log(`✅ Created ${file.description}: ${filePath}`);
    }

    console.log(`\n📁 All secrets generated in: ${outputDir}`);
    console.log('\n🚨 IMPORTANT SECURITY NOTES:');
    console.log('   1. Replace ALL placeholder values with real credentials');
    console.log('   2. Keep these files secure and never commit to version control');
    console.log('   3. Set proper file permissions (600) on production servers');
    console.log('   4. Use a proper secret management system in production');
    console.log('\n🔍 Next steps:');
    console.log('   1. Review and update all placeholder values');
    console.log('   2. Run: npm run validate:production');
    console.log('   3. Deploy using your preferred method (Docker/K8s)');
  }
}

// Main execution
if (require.main === module) {
  const generator = new SecretsGenerator();
  generator.generateProductionFiles().catch(error => {
    console.error('❌ Failed to generate secrets:', error);
    process.exit(1);
  });
}

module.exports = { SecretsGenerator };
