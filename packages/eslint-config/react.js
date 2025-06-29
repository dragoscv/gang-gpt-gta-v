/**
 * React-specific ESLint configuration
 */
module.exports = {
    extends: [
        './base.js',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
        'plugin:jsx-a11y/recommended',
    ],
    plugins: [
        'react',
        'react-hooks',
        'jsx-a11y',
    ],
    env: {
        browser: true,
    },
    settings: {
        react: {
            version: 'detect',
        },
    },
    rules: {
        // React rules
        'react/react-in-jsx-scope': 'off', // Not needed with React 17+
        'react/prop-types': 'off', // Using TypeScript for prop validation
        'react/display-name': 'off',
        'react/no-unescaped-entities': 'off',
        'react/jsx-no-target-blank': ['error', { allowReferrer: false }],
        'react/jsx-curly-brace-presence': ['error', { props: 'never', children: 'never' }],
        'react/self-closing-comp': 'error',
        'react/jsx-sort-props': [
            'error',
            {
                callbacksLast: true,
                shorthandFirst: true,
                reservedFirst: true,
            },
        ],

        // React Hooks rules
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',

        // Accessibility rules
        'jsx-a11y/anchor-is-valid': [
            'error',
            {
                components: ['Link'],
                specialLink: ['hrefLeft', 'hrefRight'],
                aspects: ['invalidHref', 'preferButton'],
            },
        ],
        'jsx-a11y/click-events-have-key-events': 'warn',
        'jsx-a11y/no-static-element-interactions': 'warn',
    },
};
