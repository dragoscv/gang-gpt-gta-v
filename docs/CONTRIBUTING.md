# 🤝 Contributing to GangGPT

Welcome to the GangGPT project! We're excited to have you contribute to the
future of AI-powered gaming. This guide will help you get started with
contributing effectively.

## 🎯 Project Vision

GangGPT aims to create the most sophisticated AI-driven gaming experience ever
built, combining cutting-edge technology with engaging gameplay in a living,
breathing virtual world.

## 📋 Before You Start

### Prerequisites

- **Node.js** 20+ and npm
- **Git** with semantic commit knowledge
- **TypeScript** experience (strict mode)
- **RAGE:MP** development familiarity (preferred)
- **Azure OpenAI** API understanding (for AI features)
- **Google Cloud Platform** basics (for infrastructure)

### Development Environment Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/gang-gpt-gta-v.git
cd gang-gpt-gta-v

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Start development services
docker-compose up -d

# Run development server
npm run dev

# Run tests
npm test

# Type checking
npm run type-check

# Linting
npm run lint
```

## 🌿 Branch Strategy

We use **Git Flow** with semantic branch naming:

### Main Branches

- `main` - Production-ready code
- `develop` - Integration branch for features

### Feature Branches

```bash
# Feature development
feature/ai-npc-memory-system
feature/faction-diplomacy-ui
feature/mission-generation-v2

# Bug fixes
fix/database-connection-pool
fix/ai-response-timeout

# Hot fixes
hotfix/security-vulnerability-patch

# Release preparation
release/v1.2.0
```

### Branch Naming Convention

```
<type>/<scope>-<description>

Types:
- feature/    New functionality
- fix/        Bug fixes
- hotfix/     Critical production fixes
- release/    Version preparation
- docs/       Documentation only
- refactor/   Code restructuring
- test/       Test additions/modifications
- chore/      Maintenance tasks
```

## 📝 Commit Message Standards

We follow **Conventional Commits** specification:

```bash
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Commit Types

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Formatting changes
- `refactor:` Code refactoring
- `test:` Test additions/modifications
- `chore:` Maintenance tasks
- `perf:` Performance improvements
- `ci:` CI/CD changes
- `build:` Build system changes

### Examples

```bash
# Feature addition
feat(ai): implement NPC memory persistence system

# Bug fix
fix(database): resolve connection pool exhaustion

# Breaking change
feat(api)!: redesign mission generation endpoint

BREAKING CHANGE: The mission generation API now requires authentication

# Scoped change
feat(ui/faction): add diplomacy interface component

# Documentation
docs(readme): update installation instructions
```

## 🏗️ Code Standards

### TypeScript Configuration

We enforce strict TypeScript settings:

```typescript
// tsconfig.json highlights
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### Code Style Guidelines

```typescript
// ✅ Good: Clear interface definitions
interface PlayerAction {
  id: string;
  playerId: string;
  actionType: ActionType;
  timestamp: Date;
  metadata: Record<string, unknown>;
}

// ✅ Good: Descriptive function names
async function generateMissionForPlayer(
  playerId: string,
  factionId: string,
  difficulty: number
): Promise<Mission> {
  // Implementation
}

// ❌ Bad: Implicit any
function processData(data) {
  return data.map(item => item.value);
}

// ✅ Good: Explicit types
function processData(data: DataItem[]): number[] {
  return data.map(item => item.value);
}
```

### File Organization

```text
src/
├── modules/
│   ├── ai/
│   │   ├── __tests__/
│   │   ├── types/
│   │   ├── services/
│   │   ├── utils/
│   │   └── index.ts
│   ├── npc/
│   ├── factions/
│   └── ...
├── shared/
│   ├── types/
│   ├── constants/
│   └── utils/
├── client/
├── server/
└── tests/
```

### Naming Conventions

- **Files**: kebab-case (`npc-memory-service.ts`)
- **Classes**: PascalCase (`NPCMemoryService`)
- **Functions**: camelCase (`generateDialogue`)
- **Variables**: camelCase (`playerData`)
- **Constants**: SCREAMING_SNAKE_CASE (`MAX_PLAYERS`)
- **Types/Interfaces**: PascalCase (`PlayerAction`)
- **Enums**: PascalCase (`ActionType`)

## 🧪 Testing Requirements

### Test Coverage Expectations

- **Unit Tests**: 80%+ coverage for all modules
- **Integration Tests**: All API endpoints and database operations
- **E2E Tests**: Critical user flows using Playwright
- **AI Tests**: Mock AI responses for consistent testing

### Test Structure

```typescript
// Example unit test
describe('NPCMemoryService', () => {
  let service: NPCMemoryService;
  let mockDatabase: jest.Mocked<Database>;

  beforeEach(() => {
    mockDatabase = createMockDatabase();
    service = new NPCMemoryService(mockDatabase);
  });

  describe('storeMemory', () => {
    it('should store memory with correct metadata', async () => {
      const memory: NPCMemory = {
        npcId: 'npc-123',
        playerId: 'player-456',
        content: 'Player helped with mission',
        emotionalWeight: 75,
        timestamp: new Date(),
      };

      await service.storeMemory(memory);

      expect(mockDatabase.insert).toHaveBeenCalledWith(
        'npc_memories',
        expect.objectContaining({
          npc_id: 'npc-123',
          player_id: 'player-456',
          emotional_weight: 75,
        })
      );
    });
  });
});
```

### AI Testing Strategy

```typescript
// Mock AI responses for consistent testing
jest.mock('../services/ai-client', () => ({
  generateResponse: jest.fn(),
  generateMission: jest.fn(),
  analyzePlayerBehavior: jest.fn(),
}));

// Test AI integration without API calls
it('should generate appropriate NPC response', async () => {
  const mockAiClient = require('../services/ai-client');
  mockAiClient.generateResponse.mockResolvedValue({
    content: 'Hello there, friend! How can I help you today?',
    mood: 'friendly',
    metadata: { confidence: 0.85 },
  });

  const response = await npcService.generateDialogue(
    'npc-123',
    'player-456',
    'greeting'
  );

  expect(response.content).toContain('Hello there');
  expect(response.mood).toBe('friendly');
});
```

## 🔍 Code Review Process

### Pull Request Requirements

1. **Branch Up-to-Date**: Rebase on latest `develop`
2. **Tests Passing**: All CI checks must pass
3. **Documentation**: Update relevant docs
4. **Type Safety**: No TypeScript errors
5. **Performance**: Consider performance implications
6. **Security**: Follow security best practices

### PR Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update
- [ ] Performance improvement

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## AI Integration

- [ ] AI prompts tested and validated
- [ ] Response handling implemented
- [ ] Error scenarios covered

## Documentation

- [ ] Code comments added
- [ ] README updated
- [ ] API docs updated

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] No console.log statements (use proper logging)
- [ ] Environment variables documented
```

### Review Guidelines

**For Reviewers:**

- Focus on logic, security, and maintainability
- Check AI integration patterns
- Verify error handling
- Ensure TypeScript strict compliance
- Test locally for complex changes

**For Authors:**

- Respond to feedback promptly
- Address all review comments
- Update tests as needed
- Maintain clean commit history

## 🤖 AI Development Guidelines

### AI Prompt Engineering

```typescript
// ✅ Good: Structured prompts with clear context
const generateNPCDialogue = async (
  context: DialogueContext
): Promise<string> => {
  const prompt = `
    SYSTEM: You are ${context.npc.name}, a ${context.npc.personality} character in GangGPT.
    
    CONTEXT:
    - Location: ${context.location}
    - Time: ${context.timeOfDay}
    - Player Reputation: ${context.playerReputation}
    - Recent Events: ${context.recentEvents.join(', ')}
    
    CONSTRAINTS:
    - Stay in character
    - Keep response under 100 words
    - Reference recent events if relevant
    - Match emotional tone: ${context.npc.currentMood}
    
    PLAYER: ${context.playerMessage}
    
    ${context.npc.name}:
  `;

  return await aiClient.generateResponse(prompt);
};
```

### AI Error Handling

```typescript
// Always implement robust error handling for AI calls
async function generateWithFallback<T>(
  primaryGenerator: () => Promise<T>,
  fallbackGenerator: () => Promise<T>,
  validator: (result: T) => boolean
): Promise<T> {
  try {
    const result = await primaryGenerator();
    if (validator(result)) {
      return result;
    }
    throw new Error('AI result validation failed');
  } catch (error) {
    logger.warn('Primary AI generation failed, using fallback', { error });
    return await fallbackGenerator();
  }
}
```

### AI Response Validation

```typescript
// Validate all AI responses before using them
interface AIValidation {
  isValid: boolean;
  errors: string[];
  sanitizedContent?: string;
}

const validateAIResponse = (
  response: string,
  context: GameContext
): AIValidation => {
  const errors: string[] = [];

  // Content safety checks
  if (containsInappropriateContent(response)) {
    errors.push('Contains inappropriate content');
  }

  // Context relevance
  if (!isContextuallyRelevant(response, context)) {
    errors.push('Response not contextually relevant');
  }

  // Length constraints
  if (response.length > MAX_RESPONSE_LENGTH) {
    errors.push('Response too long');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedContent:
      errors.length === 0 ? response : sanitizeContent(response),
  };
};
```

## 🛡️ Security Guidelines

### Environment Variables

```bash
# Never commit secrets
# Use proper environment variable management

# ❌ Bad
AZURE_OPENAI_KEY=abc123...

# ✅ Good
AZURE_OPENAI_KEY=${AZURE_OPENAI_KEY}
```

### Input Validation

```typescript
// Always validate user inputs
import { z } from 'zod';

const PlayerActionSchema = z.object({
  playerId: z.string().uuid(),
  actionType: z.enum(['move', 'interact', 'combat', 'dialogue']),
  data: z.record(z.unknown()),
  timestamp: z.date(),
});

// Validate before processing
const validatePlayerAction = (input: unknown): PlayerAction => {
  return PlayerActionSchema.parse(input);
};
```

### SQL Injection Prevention

```typescript
// ✅ Good: Use parameterized queries
const getPlayerData = async (playerId: string): Promise<Player> => {
  const result = await db.query('SELECT * FROM players WHERE id = $1', [
    playerId,
  ]);
  return result.rows[0];
};

// ❌ Bad: String concatenation
const getPlayerData = async (playerId: string): Promise<Player> => {
  const result = await db.query(
    `SELECT * FROM players WHERE id = '${playerId}'`
  );
  return result.rows[0];
};
```

## 📊 Performance Guidelines

### Database Optimization

```typescript
// Use connection pooling
const pool = new Pool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Implement caching for expensive operations
const getCachedPlayerData = async (playerId: string): Promise<Player> => {
  const cacheKey = `player:${playerId}`;

  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Fetch from database
  const player = await getPlayerFromDatabase(playerId);

  // Cache for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(player));

  return player;
};
```

### AI Performance

```typescript
// Implement response caching for similar prompts
const getCachedAIResponse = async (
  promptHash: string,
  generator: () => Promise<string>
): Promise<string> => {
  const cached = await redis.get(`ai:${promptHash}`);
  if (cached) {
    return cached;
  }

  const response = await generator();
  await redis.setex(`ai:${promptHash}`, 3600, response); // Cache for 1 hour

  return response;
};
```

## 📈 Monitoring and Logging

### Structured Logging

```typescript
import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.File({ filename: 'error.log', level: 'error' }),
    new transports.File({ filename: 'combined.log' }),
  ],
});

// Usage
logger.info('Player action processed', {
  playerId: 'player-123',
  actionType: 'mission_complete',
  duration: 1250,
  success: true,
});

logger.error('AI generation failed', {
  error: error.message,
  stack: error.stack,
  context: { playerId, missionId },
});
```

### Performance Metrics

```typescript
// Track performance metrics
const trackDuration = async <T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> => {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;

    metrics.histogram('operation_duration', duration, {
      operation,
      success: 'true',
    });

    return result;
  } catch (error) {
    const duration = Date.now() - start;

    metrics.histogram('operation_duration', duration, {
      operation,
      success: 'false',
    });

    throw error;
  }
};
```

## 🎮 Game Development Specific Guidelines

### Faction System Development

When working on faction-related features:

1. **AI Consistency**: Ensure faction AIs maintain personality across
   interactions
2. **Balance**: Consider impact on faction power balance
3. **Memory**: Update faction memory systems appropriately
4. **Relationships**: Account for inter-faction relationship changes

### Mission System Development

For mission-related contributions:

1. **AI Generation**: Test mission generation with various parameters
2. **Difficulty Scaling**: Ensure missions scale appropriately
3. **Faction Impact**: Consider how missions affect faction relationships
4. **Player Agency**: Maintain meaningful player choice

### NPC Development

When working on NPC systems:

1. **Memory Persistence**: Ensure memories are stored and retrieved correctly
2. **Personality Consistency**: NPCs should behave according to their defined
   personality
3. **Dialogue Quality**: Test AI-generated dialogue for appropriateness
4. **Performance**: Optimize memory and processing for multiple NPCs

## 🚀 Deployment Guidelines

### Environment Promotion

```bash
# Development to staging
git checkout develop
git pull origin develop
git tag -a v1.2.0-staging -m "Release candidate 1.2.0"
git push origin v1.2.0-staging

# Staging to production (after testing)
git checkout main
git merge develop
git tag -a v1.2.0 -m "Release 1.2.0"
git push origin main
git push origin v1.2.0
```

### Database Migrations

```typescript
// Always provide rollback scripts
// migrations/2025-06-01-add-npc-memory-table.sql
CREATE TABLE npc_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    npc_id VARCHAR(100) NOT NULL,
    player_id UUID REFERENCES players(id),
    memory_type VARCHAR(50) NOT NULL,
    content JSONB NOT NULL,
    emotional_weight INTEGER DEFAULT 50,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- Rollback script: rollback/2025-06-01-add-npc-memory-table.sql
DROP TABLE IF EXISTS npc_memories;
```

## 🤝 Community Guidelines

### Communication

- **Discord**: Primary communication for real-time discussion
- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Design decisions and community feedback
- **Code Reviews**: Technical discussions about implementation

### Mentorship

- **New Contributors**: Experienced contributors mentor newcomers
- **Pair Programming**: Encouraged for complex features
- **Knowledge Sharing**: Regular tech talks and documentation sessions

### Recognition

Contributors are recognized through:

- **README Contributors Section**: All contributors listed
- **Release Notes**: Major contributors highlighted
- **Community Roles**: Discord roles for active contributors
- **Beta Access**: Early access to new features

## 📋 Issue Guidelines

### Bug Reports

Use the bug report template:

```markdown
**Bug Description** Clear description of the bug

**Steps to Reproduce**

1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected Behavior** What you expected to happen

**Screenshots** If applicable, add screenshots

**Environment**

- OS: [e.g. Windows 11]
- Node.js version: [e.g. 20.10.0]
- Game version: [e.g. 1.2.0]

**Additional Context** Any other context about the problem
```

### Feature Requests

Use the feature request template:

```markdown
**Feature Description** Clear description of the proposed feature

**Use Case** Why is this feature needed?

**Proposed Solution** How should this feature work?

**Alternative Solutions** Other ways to achieve the same goal

**AI Integration** How would this feature use AI? (if applicable)

**Implementation Complexity** Rough estimate of development effort
```

## 🎯 Getting Your First Contribution Merged

### Good First Issues

Look for issues labeled:

- `good first issue`
- `beginner friendly`
- `documentation`
- `help wanted`

### Recommended First Contributions

1. **Documentation Improvements**: Fix typos, add examples, clarify instructions
2. **Test Coverage**: Add tests for existing functionality
3. **Code Comments**: Add inline documentation for complex functions
4. **Bug Fixes**: Start with small, well-defined bugs
5. **UI Improvements**: Small visual enhancements

### Success Tips

- **Start Small**: Choose manageable tasks for your first contributions
- **Ask Questions**: Use Discord or GitHub discussions when stuck
- **Follow Templates**: Use provided PR and issue templates
- **Be Patient**: Reviews take time; use feedback to improve
- **Stay Updated**: Keep your fork synced with the main repository

Remember: Every expert was once a beginner. We're here to help you succeed!

## 📞 Getting Help

- **Documentation**: Check existing docs first
- **Discord**: Real-time help from the community
- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For design questions and general discussion
- **Mentorship**: Request a mentor through Discord

Welcome to the GangGPT community! We're excited to see what you'll build with
us! 🚀
