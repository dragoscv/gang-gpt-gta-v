# GitHub Copilot Instructions for GangGPT

## Project Overview

GangGPT is an innovative AI-powered Grand Theft Auto V multiplayer server built
on RAGE:MP, transforming traditional roleplay into an immersive,
procedurally-generated experience. The project combines advanced AI systems with
modern web technologies to create a living, breathing virtual world.

## Technology Stack

### Backend

- **Runtime**: Node.js with TypeScript
- **Framework**: RAGE:MP (Grand Theft Auto V multiplayer mod)
- **AI Integration**: Azure OpenAI GPT-4o-mini
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis for session and temporary data
- **Authentication**: JWT with bcrypt hashing
- **Real-time**: Socket.IO for live updates

### Frontend

- **Framework**: Next.js 14+ with App Router
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Headless UI and Radix UI
- **State Management**: Zustand with persistence
- **API Layer**: tRPC for type-safe APIs
- **Authentication**: NextAuth.js

### Infrastructure

- **Cloud Provider**: Google Cloud Platform
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Kubernetes for production
- **CI/CD**: GitHub Actions with automated testing
- **Monitoring**: Prometheus, Grafana, and Google Cloud Monitoring
- **Logging**: Structured logging with Winston

## Code Style and Standards

### TypeScript Configuration

- Use strict mode with all strict checks enabled
- Prefer `interface` over `type` for object definitions
- Use explicit return types for all functions
- Enable `noImplicitAny` and `strictNullChecks`
- Use path mapping for clean imports (`@/` for src root)

### Naming Conventions

- **Files**: kebab-case (e.g., `ai-companion.service.ts`)
- **Directories**: kebab-case (e.g., `faction-system/`)
- **Classes**: PascalCase (e.g., `AICompanionService`)
- **Functions/Variables**: camelCase (e.g., `generateMission`)
- **Constants**: SCREAMING_SNAKE_CASE (e.g., `MAX_FACTION_SIZE`)
- **Database Tables**: snake_case (e.g., `user_profiles`)

### Code Organization

```
src/
├── modules/                 # Feature modules
│   ├── ai/                 # AI systems (companions, NPCs, missions)
│   ├── factions/           # Faction management and dynamics
│   ├── players/            # Player management and progression
│   ├── world/              # World state and environment
│   └── economy/            # Economic systems and transactions
├── shared/                 # Shared utilities and types
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   ├── constants/          # Application constants
│   └── validators/         # Input validation schemas
├── infrastructure/         # Infrastructure and external services
│   ├── database/           # Database connection and migrations
│   ├── cache/              # Redis cache management
│   ├── ai/                 # AI service integrations
│   └── monitoring/         # Logging and metrics
└── config/                 # Configuration management
```

### AI System Guidelines

#### NPC Memory Management

- Implement persistent memory with PostgreSQL storage
- Use Redis for active memory caching (last 24 hours)
- Apply memory decay algorithms for realistic forgetting
- Store emotional context and relationship tracking
- Implement memory compression for long-term storage

#### Mission Generation

- Use structured prompts with game state context
- Implement difficulty scaling based on player level
- Ensure missions fit current faction dynamics
- Generate multiple mission options for player choice
- Track mission completion for narrative continuity

#### Faction AI Behavior

- Implement decision trees for faction actions
- Use influence matrices for territory control
- Apply economic modeling for resource allocation
- Generate dynamic events based on faction relationships
- Ensure AI actions create meaningful player opportunities

### Database Design Principles

#### Schema Conventions

- Use UUID primary keys for all entities
- Include `created_at` and `updated_at` timestamps
- Implement soft deletes with `deleted_at` column
- Use foreign key constraints for data integrity
- Apply database-level validations where possible

#### Performance Optimization

- Index frequently queried columns
- Use connection pooling (max 20 connections)
- Implement query result caching for static data
- Use read replicas for analytics queries
- Apply database partitioning for large tables

### Security Implementation

#### Authentication & Authorization

- Use JWT tokens with 1-hour expiration
- Implement refresh token rotation
- Apply role-based access control (RBAC)
- Validate all inputs with Zod schemas
- Use rate limiting on all API endpoints

#### Data Protection

- Encrypt sensitive data at rest (AES-256)
- Use HTTPS for all communications
- Implement CORS with specific origins
- Apply SQL injection protection via ORM
- Log security events for monitoring

### Performance Standards

#### Response Time Targets

- API endpoints: < 200ms average
- AI responses: < 2 seconds for simple queries
- Mission generation: < 5 seconds
- Database queries: < 100ms average
- Real-time updates: < 50ms latency

#### Scalability Requirements

- Support 1,000 concurrent players
- Handle 10,000 requests per minute
- Scale AI services horizontally
- Implement graceful degradation
- Use CDN for static assets

### Testing Strategy

#### Unit Testing

- Maintain > 80% code coverage
- Test all business logic functions
- Mock external service dependencies
- Use Jest with TypeScript support
- Implement snapshot testing for UI components

#### Integration Testing

- Test API endpoints with real database
- Verify AI service integrations
- Test authentication flows
- Validate database migrations
- Check real-time communication

#### End-to-End Testing

- Use Playwright for browser automation
- Test complete user journeys
- Verify AI-generated content quality
- Test faction interaction scenarios
- Validate cross-device compatibility

### Deployment Guidelines

#### Environment Configuration

- Use `.env` files for local development
- Implement environment-specific configs
- Use Kubernetes secrets for production
- Apply health check endpoints
- Implement graceful shutdown handling

#### Monitoring and Logging

- Structure logs in JSON format
- Include correlation IDs for tracing
- Monitor AI service performance
- Track player engagement metrics
- Alert on error rate thresholds

### AI Integration Best Practices

#### Prompt Engineering

- Use system prompts for consistent behavior
- Include relevant game state context
- Implement fallback responses for errors
- Apply content filtering for safety
- Log AI interactions for improvement

#### Error Handling

- Implement retry logic with exponential backoff
- Provide graceful degradation for AI failures
- Cache AI responses when appropriate
- Use circuit breakers for external services
- Maintain service health indicators

### Localization Support

#### Multi-language Implementation

- Support Romanian and English initially
- Use i18n libraries for text management
- Implement dynamic language switching
- Store user language preferences
- Generate AI content in user's language

### Documentation Standards

#### Code Documentation

- Use JSDoc for function documentation
- Include examples in complex functions
- Document AI prompt templates
- Maintain API documentation with OpenAPI
- Keep README files updated

#### Architecture Decision Records

- Document significant technical decisions
- Include context, options, and rationale
- Update when decisions change
- Make accessible to all team members
- Link to relevant implementation details

## Development Workflow

### Git Conventions

- Use conventional commits (feat:, fix:, docs:, etc.)
- Create feature branches from `develop`
- Require PR reviews for `main` and `develop`
- Use semantic versioning for releases
- Include issue references in commit messages

### Code Review Process

- Check for TypeScript errors and warnings
- Verify test coverage for new features
- Review AI prompt effectiveness
- Validate security implementations
- Ensure performance considerations

### Quality Gates

- All tests must pass
- Code coverage > 80%
- No TypeScript errors
- Linting rules compliance
- Security scan approval

Remember: GangGPT aims to create the most immersive AI-powered roleplay
experience possible. Every code contribution should enhance the living,
breathing nature of the virtual world while maintaining high performance and
security standards.
