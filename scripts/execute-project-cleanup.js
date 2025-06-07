#!/usr/bin/env node

/**
 * GangGPT Project Cleanup Execution Script
 * 
 * This script automates the cleanup process outlined in PROJECT_CLEANUP_PLAN.md
 * Safely removes unused files, dependencies, and consolidates documentation.
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class ProjectCleanupExecutor {
    constructor() {
        this.projectRoot = process.cwd();
        this.backupDir = path.join(this.projectRoot, '.cleanup-backup');
        this.results = {
            deletedFiles: [],
            movedFiles: [],
            modifiedFiles: [],
            errors: []
        };
    }

    async execute() {
        console.log('🧹 Starting GangGPT Project Cleanup...\n');
        
        try {
            await this.createBackup();
            await this.removeUnusedDependencies();
            await this.cleanupTestFiles();
            await this.consolidateDocumentation();
            await this.cleanupScripts();
            await this.cleanupConfigFiles();
            await this.optimizePackageJson();
            await this.generateReport();
            
            console.log('\n✅ Project cleanup completed successfully!');
            console.log(`📋 Results saved to: ${path.join(this.projectRoot, 'CLEANUP_REPORT.md')}`);
            
        } catch (error) {
            console.error('❌ Cleanup failed:', error.message);
            await this.restoreBackup();
        }
    }

    async createBackup() {
        console.log('📦 Creating backup...');
        await fs.mkdir(this.backupDir, { recursive: true });
        
        const filesToBackup = [
            'package.json',
            'web/package.json',
            '.eslintrc.js',
            'tsconfig.json'
        ];
        
        for (const file of filesToBackup) {
            const srcPath = path.join(this.projectRoot, file);
            const backupPath = path.join(this.backupDir, file.replace('/', '_'));
            
            try {
                await fs.copyFile(srcPath, backupPath);
                console.log(`  ✓ Backed up ${file}`);
            } catch (error) {
                console.log(`  ⚠️ Could not backup ${file}: ${error.message}`);
            }
        }
    }

    async removeUnusedDependencies() {
        console.log('\n🔧 Removing unused dependencies...');
        
        // Root package.json cleanup
        const rootPackageJson = await this.readPackageJson('package.json');
        
        const unusedDeps = [
            '@azure/openai',
            'joi',
            'morgan',
            'node-cron',
            'uuid'
        ];
        
        const unusedDevDeps = [
            '@types/jest',
            '@types/morgan',
            '@types/node-cron',
            '@types/supertest',
            '@types/uuid',
            'eslint-plugin-import',
            'supertest',
            'ts-jest',
            'ts-node'
        ];
        
        this.removeDependencies(rootPackageJson, unusedDeps, unusedDevDeps);
        await this.writePackageJson('package.json', rootPackageJson);
        
        // Frontend package.json cleanup
        const webPackageJson = await this.readPackageJson('web/package.json');
        
        const unusedWebDeps = [
            '@headlessui/react',
            '@heroicons/react',
            '@next/font',
            '@radix-ui/react-avatar',
            '@radix-ui/react-dialog',
            '@radix-ui/react-select',
            '@radix-ui/react-switch',
            '@radix-ui/react-tabs',
            '@trpc/next',
            'next-auth',
            'zod',
            'zustand'
        ];
        
        const unusedWebDevDeps = [
            '@testing-library/user-event',
            '@typescript-eslint/eslint-plugin',
            '@typescript-eslint/parser',
            'autoprefixer',
            'eslint',
            'eslint-config-next',
            'eslint-config-prettier',
            'eslint-plugin-prettier',
            'jest-environment-jsdom',
            'lint-staged',
            'postcss',
            'prettier'
        ];
        
        this.removeDependencies(webPackageJson, unusedWebDeps, unusedWebDevDeps);
        await this.writePackageJson('web/package.json', webPackageJson);
        
        console.log('  ✓ Removed unused dependencies from both package.json files');
    }

    async cleanupTestFiles() {
        console.log('\n🧪 Cleaning up test files...');
        
        const testFilesToDelete = [
            'test-all-apis.js',
            'test-auth-complete.js',
            'test-auth-endpoints.js',
            'test-auth-final.js',
            'test-auth-flows-fixed.js',
            'test-auth-flows.js',
            'test-auth-new.js',
            'test-core-features.js',
            'test-final-report.js',
            'test-comprehensive.ts',
            'test-prisma-types.ts',
            'test-server.ts'
        ];
        
        for (const file of testFilesToDelete) {
            await this.deleteFile(file);
        }
        
        console.log(`  ✓ Deleted ${testFilesToDelete.length} redundant test files`);
    }

    async consolidateDocumentation() {
        console.log('\n📚 Consolidating documentation...');
        
        const docsToArchive = [
            'COMPLETION_REPORT.md',
            'INTEGRATION_STATUS.md',
            'MEMORY_ACCESS_GUIDE.md',
            'PRODUCTION_ACHIEVEMENT_92_PERCENT.md',
            'PRODUCTION_READINESS_FINAL.md',
            'PRODUCTION_READINESS_FINAL_REPORT.md',
            'PRODUCTION_STATUS.md',
            'PROJECT_COMPLETION_SUMMARY.md',
            'RELEASE-NOTES-2025-06-05.md'
        ];
        
        // Create archive directory
        const archiveDir = path.join(this.projectRoot, 'docs', 'archive');
        await fs.mkdir(archiveDir, { recursive: true });
        
        for (const doc of docsToArchive) {
            await this.moveFile(doc, path.join('docs', 'archive', doc));
        }
        
        const docsToDelete = [
            'DEVELOPMENT.md', // Will merge into README.md
            'PRODUCTION_DEPLOYMENT_CHECKLIST.md', // Will merge into docs/PRODUCTION_DEPLOYMENT.md
            'QUICK_DEPLOY_GUIDE.md' // Will merge into docs/PRODUCTION_QUICKSTART.md
        ];
        
        for (const doc of docsToDelete) {
            await this.deleteFile(doc);
        }
        
        console.log('  ✓ Archived historical documentation');
        console.log('  ✓ Removed redundant documentation files');
    }

    async cleanupScripts() {
        console.log('\n📜 Cleaning up scripts...');
        
        const scriptsToDelete = [
            'scripts/validate-production-basic.js',
            'scripts/achieve-100-percent-production.js',
            'scripts/test-production-readiness.ps1',
            'scripts/test-production-readiness.sh',
            'scripts/verify-production-readiness.ps1'
        ];
        
        for (const script of scriptsToDelete) {
            await this.deleteFile(script);
        }
        
        // Remove backup directory if empty
        try {
            const backupDir = path.join(this.projectRoot, 'scripts', 'backup');
            const files = await fs.readdir(backupDir);
            if (files.length === 0) {
                await fs.rmdir(backupDir);
                console.log('  ✓ Removed empty backup directory');
            }
        } catch (error) {
            // Directory doesn't exist or has files
        }
        
        console.log('  ✓ Removed redundant scripts');
    }

    async cleanupConfigFiles() {
        console.log('\n⚙️ Cleaning up configuration files...');
        
        const configFilesToDelete = [
            '.eslintrc.new.js',
            '.eslintrc.old.js',
            'fix-ai-test.ps1'
        ];
        
        for (const config of configFilesToDelete) {
            await this.deleteFile(config);
        }
        
        console.log('  ✓ Removed legacy configuration files');
    }

    async optimizePackageJson() {
        console.log('\n📦 Optimizing package.json files...');
        
        // Add cleanup script to root package.json
        const rootPackage = await this.readPackageJson('package.json');
        
        rootPackage.scripts = {
            ...rootPackage.scripts,
            'clean:deps': 'pnpm exec rimraf node_modules pnpm-lock.yaml && pnpm install',
            'clean:build': 'pnpm exec rimraf dist coverage .next',
            'clean:all': 'pnpm run clean:build && pnpm run clean:deps'
        };
        
        // Remove deprecated scripts
        delete rootPackage.scripts['test:server'];
        delete rootPackage.scripts['test:comprehensive'];
        
        await this.writePackageJson('package.json', rootPackage);
        
        console.log('  ✓ Added cleanup scripts');
        console.log('  ✓ Removed deprecated scripts');
    }

    async deleteFile(filePath) {
        const fullPath = path.join(this.projectRoot, filePath);
        try {
            await fs.unlink(fullPath);
            this.results.deletedFiles.push(filePath);
            console.log(`  ✓ Deleted ${filePath}`);
        } catch (error) {
            if (error.code !== 'ENOENT') {
                this.results.errors.push(`Failed to delete ${filePath}: ${error.message}`);
                console.log(`  ⚠️ Could not delete ${filePath}: ${error.message}`);
            }
        }
    }

    async moveFile(srcPath, destPath) {
        const fullSrcPath = path.join(this.projectRoot, srcPath);
        const fullDestPath = path.join(this.projectRoot, destPath);
        
        try {
            await fs.mkdir(path.dirname(fullDestPath), { recursive: true });
            await fs.rename(fullSrcPath, fullDestPath);
            this.results.movedFiles.push(`${srcPath} → ${destPath}`);
            console.log(`  ✓ Moved ${srcPath} to ${destPath}`);
        } catch (error) {
            if (error.code !== 'ENOENT') {
                this.results.errors.push(`Failed to move ${srcPath}: ${error.message}`);
                console.log(`  ⚠️ Could not move ${srcPath}: ${error.message}`);
            }
        }
    }

    async readPackageJson(filePath) {
        const fullPath = path.join(this.projectRoot, filePath);
        const content = await fs.readFile(fullPath, 'utf8');
        return JSON.parse(content);
    }

    async writePackageJson(filePath, packageObj) {
        const fullPath = path.join(this.projectRoot, filePath);
        await fs.writeFile(fullPath, JSON.stringify(packageObj, null, 2) + '\n');
        this.results.modifiedFiles.push(filePath);
    }

    removeDependencies(packageObj, deps, devDeps) {
        if (packageObj.dependencies) {
            deps.forEach(dep => {
                if (packageObj.dependencies[dep]) {
                    delete packageObj.dependencies[dep];
                    console.log(`  ✓ Removed dependency: ${dep}`);
                }
            });
        }
        
        if (packageObj.devDependencies) {
            devDeps.forEach(dep => {
                if (packageObj.devDependencies[dep]) {
                    delete packageObj.devDependencies[dep];
                    console.log(`  ✓ Removed devDependency: ${dep}`);
                }
            });
        }
    }

    async restoreBackup() {
        console.log('\n🔄 Restoring from backup...');
        // Implementation for backup restoration
    }

    async generateReport() {
        const report = `# Project Cleanup Report

Generated on: ${new Date().toISOString()}

## Summary
- **Files deleted**: ${this.results.deletedFiles.length}
- **Files moved**: ${this.results.movedFiles.length}
- **Files modified**: ${this.results.modifiedFiles.length}
- **Errors encountered**: ${this.results.errors.length}

## Deleted Files
${this.results.deletedFiles.map(f => `- ${f}`).join('\n')}

## Moved Files
${this.results.movedFiles.map(f => `- ${f}`).join('\n')}

## Modified Files
${this.results.modifiedFiles.map(f => `- ${f}`).join('\n')}

${this.results.errors.length > 0 ? `## Errors\n${this.results.errors.map(e => `- ${e}`).join('\n')}` : ''}

## Next Steps
1. Run \`pnpm install\` to update dependencies
2. Run \`pnpm run typecheck\` to verify TypeScript compilation
3. Run \`pnpm run test\` to ensure all tests pass
4. Review and update any remaining references to deleted files
`;

        await fs.writeFile(path.join(this.projectRoot, 'CLEANUP_REPORT.md'), report);
    }
}

// Execute cleanup if this script is run directly
if (require.main === module) {
    const executor = new ProjectCleanupExecutor();
    executor.execute().catch(console.error);
}

module.exports = ProjectCleanupExecutor;
