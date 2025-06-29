/**
 * Node.js specific ESLint configuration
 */
module.exports = {
    extends: ['./base.js'],
    env: {
        node: true,
        es6: true,
    },
    rules: {
        // Node.js specific rules
        'no-console': 'off', // Allow console in Node.js
        'no-process-env': 'off', // Allow process.env usage
        'node/no-unsupported-features/es-syntax': 'off', // Using TypeScript transpilation
        'node/no-missing-import': 'off', // TypeScript handles this
        'node/no-missing-require': 'off', // TypeScript handles this

        // Security rules
        'security/detect-object-injection': 'warn',
        'security/detect-non-literal-regexp': 'warn',
        'security/detect-unsafe-regex': 'error',
        'security/detect-buffer-noassert': 'error',
        'security/detect-child-process': 'warn',
        'security/detect-disable-mustache-escape': 'error',
        'security/detect-eval-with-expression': 'error',
        'security/detect-no-csrf-before-method-override': 'error',
        'security/detect-non-literal-fs-filename': 'warn',
        'security/detect-non-literal-require': 'warn',
        'security/detect-possible-timing-attacks': 'warn',
        'security/detect-pseudoRandomBytes': 'error',
    },
    plugins: ['security'],
};
