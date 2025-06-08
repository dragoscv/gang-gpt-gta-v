#!/usr/bin/env ts-node

/**
 * Production Configuration Validation Script
 * Validates all critical production configurations and dependencies
 */

import * as dotenv from 'dotenv';
import { Redis } from 'ioredis';
import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

// Load production environment
dotenv.config({ path: '.env.production' });

interface ValidationResult {
  service: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
  details?: any;
}

class ProductionValidator {
  private results: ValidationResult[] = [];

  /**
   * Validate environment variables
   */
  private validateEnvironment(): ValidationResult[] {
    const results: ValidationResult[] = [];

    const requiredVars = [
      'NODE_ENV',
      'DATABASE_URL',
      'REDIS_URL',
      'AZURE_OPENAI_ENDPOINT',
      'AZURE_OPENAI_API_KEY',
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
    ];

    const productionSecrets = [
      'POSTGRES_PASSWORD',
      'REDIS_PASSWORD',
      'GRAFANA_ADMIN_PASSWORD',
    ];

    // Check required environment variables
    for (const envVar of requiredVars) {
      const value = process.env[envVar];
      if (!value) {
        results.push({
          service: 'Environment',
          status: 'FAIL',
          message: `Missing required environment variable: ${envVar}`,
        });
      } else if (value === 'your-secret-key' || value.includes('change-this')) {
        results.push({
          service: 'Environment',
          status: 'FAIL',
          message: `Default/insecure value for ${envVar}. Must be changed for production.`,
        });
      } else {
        results.push({
          service: 'Environment',
          status: 'PASS',
          message: `${envVar} is properly configured`,
        });
      }
    }

    // Check production secrets
    for (const secret of productionSecrets) {
      const value = process.env[secret];
      if (!value) {
        results.push({
          service: 'Environment',
          status: 'WARNING',
          message: `Production secret ${secret} not set. Required for Docker deployment.`,
        });
      } else if (value.length < 16) {
        results.push({
          service: 'Environment',
          status: 'WARNING',
          message: `Production secret ${secret} appears weak (< 16 characters)`,
        });
      } else {
        results.push({
          service: 'Environment',
          status: 'PASS',
          message: `${secret} is properly configured`,
        });
      }
    }

    // Check NODE_ENV
    if (process.env.NODE_ENV !== 'production') {
      results.push({
        service: 'Environment',
        status: 'WARNING',
        message: `NODE_ENV is '${process.env.NODE_ENV}', should be 'production'`,
      });
    }

    return results;
  }

  /**
   * Validate Redis connection
   */
  private async validateRedis(): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    try {
      const redisUrl = process.env.REDIS_URL;
      if (!redisUrl) {
        results.push({
          service: 'Redis',
          status: 'FAIL',
          message: 'REDIS_URL environment variable not set',
        });
        return results;
      }

      const redis = new Redis(redisUrl, {
        connectTimeout: 5000,
        lazyConnect: true,
        maxRetriesPerRequest: 2,
      });

      // Test connection
      await redis.connect();
      const pong = await redis.ping();

      if (pong === 'PONG') {
        results.push({
          service: 'Redis',
          status: 'PASS',
          message: 'Redis connection successful',
        });

        // Test basic operations
        await redis.set('production-test', 'validation', 'EX', 10);
        const testValue = await redis.get('production-test');

        if (testValue === 'validation') {
          results.push({
            service: 'Redis',
            status: 'PASS',
            message: 'Redis read/write operations working',
          });
        } else {
          results.push({
            service: 'Redis',
            status: 'FAIL',
            message: 'Redis read/write operations failed',
          });
        }

        // Clean up test key
        await redis.del('production-test');
      } else {
        results.push({
          service: 'Redis',
          status: 'FAIL',
          message: 'Redis ping failed',
        });
      }

      await redis.disconnect();
    } catch (error) {
      results.push({
        service: 'Redis',
        status: 'FAIL',
        message: `Redis connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error,
      });
    }

    return results;
  }

  /**
   * Validate PostgreSQL connection
   */
  private async validateDatabase(): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    try {
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        results.push({
          service: 'Database',
          status: 'FAIL',
          message: 'DATABASE_URL environment variable not set',
        });
        return results;
      }

      const prisma = new PrismaClient({
        datasources: {
          db: {
            url: databaseUrl,
          },
        },
      });

      // Test connection
      await prisma.$connect();
      results.push({
        service: 'Database',
        status: 'PASS',
        message: 'PostgreSQL connection successful',
      });

      // Test basic query
      const result = await prisma.$queryRaw`SELECT 1 as test`;
      if (result) {
        results.push({
          service: 'Database',
          status: 'PASS',
          message: 'PostgreSQL query execution working',
        });
      }

      // Check if migrations are applied
      try {
        const tables = await prisma.$queryRaw`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public'
        `;

        const tableCount = Array.isArray(tables) ? tables.length : 0;
        if (tableCount > 0) {
          results.push({
            service: 'Database',
            status: 'PASS',
            message: `Database schema contains ${tableCount} tables`,
          });
        } else {
          results.push({
            service: 'Database',
            status: 'WARNING',
            message: 'Database schema appears empty. Run migrations first.',
          });
        }
      } catch (error) {
        results.push({
          service: 'Database',
          status: 'WARNING',
          message: 'Could not check database schema',
        });
      }

      await prisma.$disconnect();
    } catch (error) {
      results.push({
        service: 'Database',
        status: 'FAIL',
        message: `PostgreSQL connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error,
      });
    }

    return results;
  }

  /**
   * Validate Azure OpenAI connection
   */
  private async validateAzureOpenAI(): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    try {
      const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
      const apiKey = process.env.AZURE_OPENAI_API_KEY;
      const apiVersion = process.env.AZURE_OPENAI_API_VERSION;
      const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;

      if (!endpoint || !apiKey) {
        results.push({
          service: 'Azure OpenAI',
          status: 'FAIL',
          message: 'Azure OpenAI endpoint or API key not configured',
        });
        return results;
      }

      if (apiKey === 'your_azure_openai_api_key') {
        results.push({
          service: 'Azure OpenAI',
          status: 'FAIL',
          message: 'Azure OpenAI API key is using default placeholder value',
        });
        return results;
      }

      const client = new OpenAI({
        apiKey,
        baseURL: endpoint,
        defaultHeaders: {
          'api-version': apiVersion || '2024-02-01',
        },
      });

      // Test simple completion
      const response = await client.chat.completions.create({
        model: deploymentName || 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: 'Say "Production validation test successful" if you can read this.',
          },
        ],
        max_tokens: 20,
      }); if (response.choices && response.choices.length > 0) {
        const content = response.choices[0].message?.content;
        if (content && content.includes('Production validation test successful')) {
          results.push({
            service: 'Azure OpenAI',
            status: 'PASS',
            message: 'Azure OpenAI API connection and response successful',
            details: {
              model: response.model,
              usage: response.usage,
            },
          });
        } else {
          results.push({
            service: 'Azure OpenAI',
            status: 'WARNING',
            message: 'Azure OpenAI connected but unexpected response',
            details: { response: content },
          });
        }
      } else {
        results.push({
          service: 'Azure OpenAI',
          status: 'FAIL',
          message: 'Azure OpenAI returned empty response',
          details: response,
        });
      }
    } catch (error) {
      results.push({
        service: 'Azure OpenAI',
        status: 'FAIL',
        message: `Azure OpenAI connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error,
      });
    }

    return results;
  }

  /**
   * Validate file system permissions and directories
   */
  private validateFileSystem(): ValidationResult[] {
    const results: ValidationResult[] = [];

    const requiredDirs = [
      './logs',
      './prisma',
    ];

    const requiredFiles = [
      './prisma/schema.prisma',
      './package.json',
      './Dockerfile',
      './docker-compose.prod.yml',
    ];

    // Check directories
    for (const dir of requiredDirs) {
      try {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
          results.push({
            service: 'File System',
            status: 'PASS',
            message: `Created required directory: ${dir}`,
          });
        } else {
          // Check write permissions
          const testFile = path.join(dir, '.test-write');
          fs.writeFileSync(testFile, 'test');
          fs.unlinkSync(testFile);

          results.push({
            service: 'File System',
            status: 'PASS',
            message: `Directory ${dir} exists and is writable`,
          });
        }
      } catch (error) {
        results.push({
          service: 'File System',
          status: 'FAIL',
          message: `Directory ${dir} issue: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }

    // Check required files
    for (const file of requiredFiles) {
      if (fs.existsSync(file)) {
        results.push({
          service: 'File System',
          status: 'PASS',
          message: `Required file exists: ${file}`,
        });
      } else {
        results.push({
          service: 'File System',
          status: 'FAIL',
          message: `Required file missing: ${file}`,
        });
      }
    }

    return results;
  }

  /**
   * Run all validations
   */
  async validate(): Promise<ValidationResult[]> {
    console.log('🔍 Starting Production Configuration Validation...\n');

    // Environment validation
    console.log('📋 Validating Environment Variables...');
    this.results.push(...this.validateEnvironment());

    // File system validation
    console.log('📁 Validating File System...');
    this.results.push(...this.validateFileSystem());

    // Database validation
    console.log('🗄️  Validating Database Connection...');
    this.results.push(...await this.validateDatabase());

    // Redis validation
    console.log('🔴 Validating Redis Connection...');
    this.results.push(...await this.validateRedis());

    // Azure OpenAI validation
    console.log('🤖 Validating Azure OpenAI Integration...');
    this.results.push(...await this.validateAzureOpenAI());

    return this.results;
  }

  /**
   * Generate validation report
   */
  generateReport(): void {
    console.log('\n' + '='.repeat(80));
    console.log('📊 PRODUCTION VALIDATION REPORT');
    console.log('='.repeat(80));

    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const warnings = this.results.filter(r => r.status === 'WARNING').length;

    console.log(`\n📈 SUMMARY:`);
    console.log(`   ✅ Passed: ${passed}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   ⚠️  Warnings: ${warnings}`);
    console.log(`   📊 Total: ${this.results.length}`);    // Group by service
    const byService = this.results.reduce((acc, result) => {
      if (!acc[result.service]) {
        acc[result.service] = [];
      }
      acc[result.service]!.push(result);
      return acc;
    }, {} as Record<string, ValidationResult[]>);

    // Display results by service
    for (const [service, results] of Object.entries(byService)) {
      console.log(`\n🔧 ${service.toUpperCase()}:`);
      for (const result of results) {
        const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
        console.log(`   ${icon} ${result.message}`);
        if (result.details && result.status === 'FAIL') {
          console.log(`      Details: ${JSON.stringify(result.details, null, 2).substring(0, 200)}...`);
        }
      }
    }

    // Production readiness assessment
    console.log('\n' + '='.repeat(80));
    if (failed === 0) {
      console.log('🎉 PRODUCTION READY: All critical validations passed!');
      if (warnings > 0) {
        console.log(`⚠️  Note: ${warnings} warnings should be addressed before deployment.`);
      }
    } else {
      console.log(`❌ NOT PRODUCTION READY: ${failed} critical issues must be resolved.`);
    }
    console.log('='.repeat(80));
  }
}

// Main execution
async function main() {
  const validator = new ProductionValidator();

  try {
    await validator.validate();
    validator.generateReport();

    const failed = validator['results'].filter(r => r.status === 'FAIL').length;
    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Validation script failed:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}
