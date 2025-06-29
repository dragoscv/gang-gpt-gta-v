/**
 * Next.js specific ESLint configuration
 */
module.exports = {
    extends: [
        './react.js',
        'next/core-web-vitals',
    ],
    rules: {
        // Next.js specific rules
        '@next/next/no-img-element': 'error',
        '@next/next/no-page-custom-font': 'error',
        '@next/next/no-sync-scripts': 'error',
        '@next/next/no-title-in-document-head': 'error',
        '@next/next/no-duplicate-head': 'error',
        '@next/next/no-css-tags': 'error',
        '@next/next/no-styled-jsx-in-document': 'error',
        '@next/next/no-server-import-in-page': 'error',
        '@next/next/no-head-import-in-document': 'error',
        '@next/next/no-document-import-in-page': 'error',
        '@next/next/no-head-element': 'error',
        '@next/next/no-html-link-for-pages': 'error',
        '@next/next/google-font-display': 'error',
        '@next/next/google-font-preconnect': 'error',
        '@next/next/next-script-for-ga': 'error',
        '@next/next/no-before-interactive-script-outside-document': 'error',
        '@next/next/inline-script-id': 'error',

        // Performance rules
        '@next/next/no-unwanted-polyfillio': 'error',

        // Image optimization
        'jsx-a11y/alt-text': [
            'error',
            {
                elements: ['img'],
                img: ['Image'],
            },
        ],
    },
    settings: {
        next: {
            rootDir: ['apps/*/'],
        },
    },
};
