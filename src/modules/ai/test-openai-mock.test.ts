import { describe, it, expect, beforeEach, vi } from 'vitest';
import OpenAI from 'openai';

// Mock OpenAI
const mockOpenAI = {
  chat: {
    completions: {
      create: vi.fn().mockResolvedValue({ content: 'test' }),
    },
  },
};

vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => mockOpenAI),
  };
});

describe('OpenAI Mock Test', () => {
  it('should properly mock OpenAI constructor', () => {
    const client = new OpenAI({ apiKey: 'test' });
    expect(client).toBe(mockOpenAI);
    expect(client.chat.completions.create).toBeDefined();
  });

  it('should track method calls', async () => {
    const client = new OpenAI({ apiKey: 'test' });
    await client.chat.completions.create({ model: 'gpt-4', messages: [] });
    expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(1);
  });
});
