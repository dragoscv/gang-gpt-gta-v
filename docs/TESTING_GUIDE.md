# 🧪 Testing Guide

## Overview

This comprehensive testing guide covers all testing procedures, frameworks, and validation processes for the GangGPT project.

## Testing Strategy

### Testing Pyramid
```
                    ┌─────────────────┐
                    │   E2E Tests     │ (Few, High-level)
                    │   (Playwright)  │
                ┌───┴─────────────────┴───┐
                │   Integration Tests     │ (Some, API/DB)
                │   (Vitest + Supertest)  │
            ┌───┴─────────────────────────┴───┐
            │        Unit Tests               │ (Many, Fast)
            │       (Vitest + Mocks)          │
            └─────────────────────────────────┘
```

### Testing Frameworks
- **Unit Tests**: Vitest with TypeScript support
- **Integration Tests**: Vitest + Supertest for API testing
- **E2E Tests**: Playwright for browser automation
- **RAGE:MP Tests**: Custom test harness for game server

## 🔧 Setup and Configuration

### Install Dependencies
```bash
# Install all testing dependencies
pnpm install

# Install Playwright browsers
npx playwright install
```

### Environment Setup
```bash
# Create test environment file
cp .env.example .env.test

# Configure test database
DATABASE_URL="postgresql://test:test@localhost:4831/gang_gpt_test_db"
REDIS_URL="redis://localhost:4832"
```

### Test Database Setup
```bash
# Create test database
npx prisma migrate deploy --preview-feature
npx prisma db push
```

## 🧪 Running Tests

### Unit Tests
```bash
# Run all unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run with coverage
pnpm test:coverage

# Run specific test file
pnpm test src/modules/ai/ai.service.test.ts
```

### Integration Tests
```bash
# Run API integration tests
pnpm test src/api/**/*.test.ts

# Run database integration tests
pnpm test src/infrastructure/database/**/*.test.ts
```

### End-to-End Tests
```bash
# Run E2E tests
pnpm test:e2e

# Run E2E tests in headed mode
npx playwright test --headed

# Run specific E2E test
npx playwright test tests/game-connection.spec.ts
```

### RAGE:MP Server Tests
```bash
# Run RAGE:MP server tests
pnpm test:ragemp

# Test server startup
.\scripts\test-server-startup.ps1

# Test client connections
.\scripts\test-client-connection.ps1
```

## 📋 Test Categories

### 1. Unit Tests

#### AI Service Tests
```typescript
// src/modules/ai/ai.service.test.ts
describe('AI Service', () => {
  it('should generate companion response', async () => {
    const response = await aiService.generateCompanionResponse(
      'npc_001',
      'Hello there!',
      { location: 'Los Santos', faction: 'Grove Street' }
    );
    
    expect(response).toBeDefined();
    expect(response.content).toContain('greeting');
  });
});
```

#### Database Service Tests
```typescript
// src/infrastructure/database/database.test.ts
describe('Database Service', () => {
  it('should connect to database', async () => {
    const connection = await db.connect();
    expect(connection).toBeDefined();
  });
});
```

#### WebSocket Tests
```typescript
// src/infrastructure/websocket/websocket.test.ts
describe('WebSocket Manager', () => {
  it('should handle client connections', async () => {
    const client = io('http://localhost:4828');
    await expect(client.connected).toBe(true);
  });
});
```

### 2. Integration Tests

#### API Endpoint Tests
```typescript
// src/api/routes/health.test.ts
describe('Health Endpoint', () => {
  it('should return service status', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });
});
```

#### RAGE:MP Integration Tests
```typescript
// tests/integration/ragemp.test.ts
describe('RAGE:MP Integration', () => {
  it('should start server successfully', async () => {
    const server = await startRageMPServer();
    expect(server.isRunning).toBe(true);
  });
});
```

### 3. End-to-End Tests

#### Game Connection Flow
```typescript
// tests/e2e/game-connection.spec.ts
test('player can connect to game', async ({ page }) => {
  await page.goto('http://localhost:4829');
  await page.click('[data-testid="connect-button"]');
  await expect(page.locator('.connection-status')).toHaveText('Connected');
});
```

#### AI Interaction Flow
```typescript
// tests/e2e/ai-interaction.spec.ts
test('player can interact with AI NPC', async ({ page }) => {
  await connectToGame(page);
  await page.click('[data-testid="npc-interaction"]');
  await page.fill('[data-testid="chat-input"]', 'Hello NPC!');
  await expect(page.locator('.npc-response')).toBeVisible();
});
```

## 🎯 Test Coverage Requirements

### Coverage Targets
- **Unit Tests**: 80% minimum coverage
- **Integration Tests**: Critical paths covered
- **E2E Tests**: Main user journeys covered

### Coverage Reports
```bash
# Generate coverage report
pnpm test:coverage

# View coverage in browser
open coverage/index.html
```

### Critical Areas
- ✅ AI service interactions
- ✅ Database operations
- ✅ Authentication flows
- ✅ WebSocket connections
- ✅ RAGE:MP server integration

## 🔄 Continuous Integration

### GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run unit tests
        run: pnpm test
      
      - name: Run E2E tests
        run: pnpm test:e2e
```

### Pre-commit Hooks
```bash
# Install pre-commit hooks
npx husky install

# Add test hook
npx husky add .husky/pre-commit "pnpm test && pnpm lint"
```

## 🐛 Debugging Tests

### Debug Unit Tests
```bash
# Debug specific test
node --inspect-brk ./node_modules/.bin/vitest run src/modules/ai/ai.service.test.ts

# Debug in VS Code
# Add breakpoints and use "Debug Test" in VS Code
```

### Debug E2E Tests
```bash
# Run with debug mode
npx playwright test --debug

# Run with browser visible
npx playwright test --headed --slowMo=1000
```

### Debug RAGE:MP Tests
```powershell
# Enable verbose logging
$env:RAGEMP_DEBUG = "true"
.\scripts\test-ragemp-connection.ps1 -Verbose
```

## 📊 Performance Testing

### Load Testing
```bash
# Install Artillery
npm install -g artillery

# Run load tests
artillery run tests/load/api-load-test.yml
```

### Memory Leak Testing
```bash
# Run tests with memory monitoring
node --inspect --max-old-space-size=4096 ./node_modules/.bin/vitest run
```

### Database Performance
```sql
-- Test query performance
EXPLAIN ANALYZE SELECT * FROM users WHERE faction_id = 1;
```

## 🧹 Test Maintenance

### Cleaning Test Data
```bash
# Clear test database
npx prisma migrate reset --force

# Clear test cache
redis-cli -h localhost -p 4832 FLUSHALL
```

### Updating Test Fixtures
```typescript
// tests/fixtures/user.fixture.ts
export const createTestUser = () => ({
  id: 'test_user_1',
  username: 'testplayer',
  faction: 'Grove Street'
});
```

### Mock Data Management
```typescript
// tests/mocks/ai.mock.ts
export const mockAIResponse = {
  content: 'Hello player!',
  timestamp: new Date(),
  confidence: 0.95
};
```

## 🚀 Testing Best Practices

### Writing Good Tests
1. **Arrange, Act, Assert** pattern
2. **Descriptive test names**
3. **Independent tests** (no shared state)
4. **Fast execution** (mock external dependencies)
5. **Reliable** (no flaky tests)

### Test Organization
```
tests/
├── unit/           # Unit tests alongside source
├── integration/    # API and service integration
├── e2e/           # End-to-end browser tests
├── fixtures/      # Test data and fixtures
├── mocks/         # Mock implementations
└── utils/         # Test utilities and helpers
```

### Common Patterns
```typescript
// Setup and teardown
beforeEach(async () => {
  await setupTestDatabase();
});

afterEach(async () => {
  await cleanupTestData();
});

// Mock external services
vi.mock('@/modules/ai/openai.service', () => ({
  generateResponse: vi.fn().mockResolvedValue(mockResponse)
}));
```

## 📈 Test Metrics

### Key Metrics
- **Test Coverage**: Percentage of code covered
- **Test Duration**: Time to run full suite
- **Flaky Test Rate**: Tests that fail intermittently
- **Test Maintenance**: Time spent fixing tests

### Monitoring
```bash
# Generate test metrics
pnpm test:metrics

# View test trends
npm run test:trends
```

## 🔧 Troubleshooting Tests

### Common Issues
1. **Tests timeout**: Increase timeout values
2. **Database conflicts**: Use test isolation
3. **Port conflicts**: Use dynamic port allocation
4. **Flaky tests**: Add proper waits and retries

### Getting Help
- Check test logs: `logs/test.log`
- Run with verbose output: `pnpm test --verbose`
- Use test debugger: VS Code debugging
- Community support: GitHub Discussions
