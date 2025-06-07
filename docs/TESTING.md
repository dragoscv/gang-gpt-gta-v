# Testing Strategy Documentation

This document outlines the testing approach used across the GangGPT project, with specific details on how to run and write tests for different components.

## Table of Contents
- [Testing Philosophy](#testing-philosophy)
- [Test Types](#test-types)
- [Testing Infrastructure](#testing-infrastructure)
- [Running Tests](#running-tests)
- [Writing New Tests](#writing-new-tests)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Testing Philosophy

The GangGPT project follows a comprehensive testing strategy to ensure high-quality code and prevent regressions. Our approach includes:

- **Unit Tests** for individual functions and components
- **Integration Tests** for API client and service interactions
- **End-to-End Tests** for complete user flows

We aim for a minimum of 80% code coverage for critical components and follow the principle of testing behavior, not implementation details.

## Test Types

### Unit Tests
- Test isolated components and functions
- Use mocks for external dependencies
- Focus on edge cases and error handling
- Fast execution for rapid feedback

### Integration Tests
- Test interactions between components
- Verify API client behavior
- Test database operations
- Ensure services work together correctly

### End-to-End Tests
- Test complete user flows
- Run in a browser environment with Playwright
- Verify actual API responses
- Test responsive design and accessibility

## Testing Infrastructure

### Frontend Tests
- **Framework**: Jest with React Testing Library
- **Configuration**: Located in `web/jest.config.js`
- **Environment**: JSDOM for browser-like environment
- **Test Files**: Located in `__tests__` directories alongside components

### E2E Tests
- **Framework**: Playwright
- **Configuration**: Located in `web/playwright.config.ts`
- **Test Files**: Located in `web/e2e/` directory

## Running Tests

### Frontend Unit/Integration Tests
```bash
# Navigate to web directory
cd web

# Run all tests
npm test

# Run specific test file
npm test -- components/sections/__tests__/statistics-simple.test.tsx

# Run tests with coverage report
npm test -- --coverage

# Run tests in watch mode (for development)
npm test -- --watch
```

### End-to-End Tests
```bash
# Navigate to web directory
cd web

# Install Playwright browsers (first time only)
npx playwright install

# Run all E2E tests
npx playwright test

# Run specific E2E test file
npx playwright test e2e/statistics.e2e.test.ts

# Run E2E tests with UI
npx playwright test --ui

# Run E2E tests with headed browsers
npx playwright test --headed
```

## Writing New Tests

### Unit Test Example
```typescript
// components/sections/__tests__/component-name.test.tsx
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ComponentName } from '../component-name';

describe('ComponentName', () => {
  it('should render correctly with default props', () => {
    render(<ComponentName />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle specific condition', () => {
    render(<ComponentName prop="value" />);
    expect(screen.getByRole('button')).toBeEnabled();
  });
});
```

### API Client Test Example
```typescript
// lib/__tests__/api-client.test.ts
import { apiClient } from '../api-client';

describe('API Client', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    // Setup mocks
    global.fetch = jest.fn();
  });

  it('should call the correct endpoint', async () => {
    // Setup
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: 'value' }),
    });

    // Execute
    await apiClient.getData();

    // Verify
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:22005/api/data',
      expect.objectContaining({ method: 'GET' })
    );
  });
});
```

### E2E Test Example
```typescript
// e2e/feature-name.e2e.test.ts
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should perform expected action', async ({ page }) => {
    // Navigate to page
    await page.goto('http://localhost:3000/feature-page');

    // Interact with elements
    await page.getByRole('button', { name: 'Submit' }).click();

    // Check results
    await expect(page.getByText('Success')).toBeVisible();
  });
});
```

## Best Practices

### General
- Keep tests simple and focused on one behavior
- Use descriptive test names that explain what is being tested
- Avoid testing implementation details
- Test both happy path and edge cases

### Mocking
- Only mock what is necessary
- Use `jest.fn()` for function mocks
- Use `jest.spyOn()` for spying on method calls
- Reset mocks between tests

### Assertions
- Use the most specific assertion possible
- Prefer Testing Library queries that match user behavior
- Chain assertions with `expect().toHaveLength()` or similar

## Troubleshooting

### Common Issues
- **Module Resolution Errors**: Check that Jest's `moduleNameMapper` in `jest.config.js` matches the path aliases in `tsconfig.json`
- **JSDOM Limitations**: Some browser APIs aren't available in JSDOM; mock these or use Playwright for true browser testing
- **Timeouts**: Increase timeout for long-running tests or optimize the test
- **Flaky Tests**: Identify and fix race conditions, add proper waits in E2E tests

### Debugging Tips
- Use `console.log()` in tests (outputs appear in test results)
- Use `debug()` from Testing Library to see the rendered DOM
- For E2E tests, use `await page.pause()` to pause execution
- Run single tests with `it.only()` or `test.only()`

---

**Last Updated**: June 5, 2025
**Contact**: For questions about testing strategy, contact the development team.
