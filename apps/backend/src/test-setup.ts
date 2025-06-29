import { vi } from 'vitest';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'file:./test.db';
process.env.AZURE_OPENAI_ENDPOINT = 'https://test-endpoint.openai.azure.com/';
process.env.AZURE_OPENAI_API_KEY = 'test-api-key';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.ENABLE_AI_COMPANIONS = 'true';
process.env.ENABLE_DYNAMIC_MISSIONS = 'true';

// Mock external dependencies
vi.mock('openai', () => ({
  default: vi.fn(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content: 'Test AI response' } }],
          usage: { total_tokens: 10 },
        }),
      },
    },
    embeddings: {
      create: vi.fn().mockResolvedValue({
        data: [{ embedding: new Array(1536).fill(0).map(() => Math.random()) }],
        usage: { total_tokens: 5 },
      }),
    },
  })),
}));

vi.mock('ioredis', () => ({
  default: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    exists: vi.fn(),
    expire: vi.fn(),
    disconnect: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    status: 'ready',
  })),
  Redis: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    exists: vi.fn(),
    expire: vi.fn(),
    disconnect: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    status: 'ready',
  })),
}));

// Mock Prisma client
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => ({
    $connect: vi.fn(),
    $disconnect: vi.fn(),
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    aiCompanion: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    faction: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  })),
}));

// Mock RAGE:MP
(global as any).mp = {
  events: {
    add: vi.fn(),
    call: vi.fn(),
    callRemote: vi.fn(),
  },
  players: {
    length: 0,
    at: vi.fn(),
    forEach: vi.fn(),
  },
  vehicles: {
    new: vi.fn(),
    length: 0,
  },
  world: {
    time: { hour: 12, minute: 0, second: 0 },
    weather: 'CLEAR',
  },
} as any;
