import { defineConfig } from 'vitest/config';
import path from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
    plugins: [tsconfigPaths()],
    test: {
        globals: true,
        environment: 'node',
        include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
        exclude: ['node_modules/**', 'dist/**', '**/*.d.ts'],
        setupFiles: ['./src/test-setup.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov', 'html'],
            exclude: [
                'node_modules/**',
                'dist/**',
                '**/*.d.ts',
                '**/*.test.ts',
                '**/*.spec.ts',
                'coverage/**'
            ],
            thresholds: {
                global: {
                    branches: 80,
                    functions: 80,
                    lines: 80,
                    statements: 80
                }
            }
        }
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@/modules': path.resolve(__dirname, './src/modules'),
            '@/shared': path.resolve(__dirname, './src/shared'),
            '@/infrastructure': path.resolve(__dirname, './src/infrastructure'),
            '@/config': path.resolve(__dirname, './src/config'),
            '@/api': path.resolve(__dirname, './src/api'),
            '@/security': path.resolve(__dirname, './src/security')
        }
    }
});
