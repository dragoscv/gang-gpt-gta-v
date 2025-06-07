export default {
    preset: 'ts-jest/presets/default-esm',
    extensionsToTreatAsEsm: ['.ts'],
    testEnvironment: 'node',
    roots: ['<rootDir>/src', '<rootDir>/tests'],
    testMatch: [
        '**/__tests__/**/*.ts',
        '**/?(*.)+(spec|test).ts'
    ],
    transform: {
        '^.+\\.ts$': ['ts-jest', { useESM: true }],
        '^.+\\.js$': ['ts-jest', { useESM: true }],
    },
    transformIgnorePatterns: [
        'node_modules/(?!(superjson|@trpc/.*|@prisma/.*|@next/.*)/)'
    ],    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
        '!src/**/*.test.ts',
        '!src/**/*.spec.ts'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: [
        'text',
        'lcov',
        'html'
    ], coverageThreshold: {
        global: {
            branches: 60,
            functions: 70,
            lines: 70,
            statements: 70
        }
    },
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@/modules/(.*)$': '<rootDir>/src/modules/$1',
        '^@/shared/(.*)$': '<rootDir>/src/shared/$1',
        '^@/infrastructure/(.*)$': '<rootDir>/src/infrastructure/$1',
        '^@/config/(.*)$': '<rootDir>/src/config/$1'
    },
    setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
    testTimeout: 10000,
    verbose: true,
    clearMocks: true,
    restoreMocks: true
};
