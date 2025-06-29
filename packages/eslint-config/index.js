/**
 * Main ESLint configuration for GangGPT
 */
module.exports = {
    extends: ['./base.js'],
    env: {
        node: true,
        es2022: true,
    },
    parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
    },
};
