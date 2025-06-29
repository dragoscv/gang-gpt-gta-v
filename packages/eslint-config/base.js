/**
 * Base ESLint configuration
 */
module.exports = {
    parser: '@typescript-eslint/parser',
    extends: [
        'eslint:recommended',
        '@typescript-eslint/recommended',
        'eslint-config-prettier',
    ],
    plugins: [
        '@typescript-eslint',
        'import',
        'prettier',
    ],
    rules: {
        // Prettier integration
        'prettier/prettier': 'error',

        // TypeScript specific rules
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-non-null-assertion': 'warn',
        '@typescript-eslint/prefer-nullish-coalescing': 'error',
        '@typescript-eslint/prefer-optional-chain': 'error',
        '@typescript-eslint/no-unnecessary-condition': 'warn',
        '@typescript-eslint/no-floating-promises': 'error',
        '@typescript-eslint/await-thenable': 'error',

        // Import rules
        'import/order': [
            'error',
            {
                groups: [
                    'builtin',
                    'external',
                    'internal',
                    'parent',
                    'sibling',
                    'index',
                ],
                'newlines-between': 'never',
                alphabetize: {
                    order: 'asc',
                    caseInsensitive: true,
                },
            },
        ],
        'import/no-duplicates': 'error',
        'import/no-unresolved': 'off', // Handled by TypeScript

        // General rules
        'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
        'no-debugger': 'error',
        'no-alert': 'error',
        'no-var': 'error',
        'prefer-const': 'error',
        'prefer-template': 'error',
        'object-shorthand': 'error',
        'no-duplicate-imports': 'error',
        'no-useless-rename': 'error',
        'prefer-destructuring': ['error', { object: true, array: false }],

        // Async/Promise rules
        'require-await': 'error',
        'no-return-await': 'error',
        'prefer-promise-reject-errors': 'error',

        // Error prevention
        'no-implicit-coercion': 'error',
        'no-implied-eval': 'error',
        'no-new-wrappers': 'error',
        'no-throw-literal': 'error',
        'no-unmodified-loop-condition': 'error',
        'no-unused-expressions': 'error',

        // Style consistency
        'consistent-return': 'error',
        'curly': ['error', 'all'],
        'dot-notation': 'error',
        'eqeqeq': ['error', 'strict'],
        'no-else-return': 'error',
        'no-lonely-if': 'error',
        'no-unneeded-ternary': 'error',
        'prefer-exponentiation-operator': 'error',
        'yoda': 'error',
    },
    settings: {
        'import/resolver': {
            typescript: {
                alwaysTryTypes: true,
            },
        },
    },
};
