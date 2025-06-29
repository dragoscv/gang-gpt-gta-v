import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import router from './game.routes';
import { logger } from '../../infrastructure/logging';

// Mock logger
vi.mock('../../infrastructure/logging', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/game', router);
  return app;
};

describe('Game Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = createTestApp();
    vi.clearAllMocks();
  });

  describe('POST /api/game/player-join', () => {
    it('should handle valid player join', async () => {
      const playerData = {
        playerId: 1,
        playerName: 'TestPlayer',
        socialClub: 'testplayer123',
        ip: '127.0.0.1',
      };

      const response = await request(app)
        .post('/api/game/player-join')
        .send(playerData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Welcome to GangGPT, TestPlayer!',
        playerData: {
          id: 1,
          name: 'TestPlayer',
          level: 1,
          money: 10000,
        },
      });

      expect(logger.info).toHaveBeenCalledWith(
        '🎮 Game API: Player TestPlayer (ID: 1) joined from 127.0.0.1'
      );
    });

    it('should handle player join without optional fields', async () => {
      const playerData = {
        playerId: 2,
        playerName: 'MinimalPlayer',
      };

      const response = await request(app)
        .post('/api/game/player-join')
        .send(playerData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.playerData.name).toBe('MinimalPlayer');
    });

    it('should reject invalid player data', async () => {
      const invalidData = {
        playerId: 'invalid', // Should be number
        playerName: '', // Should not be empty
      };

      await request(app)
        .post('/api/game/player-join')
        .send(invalidData)
        .expect(400);
    });

    it('should track active sessions', async () => {
      const player1 = { playerId: 1, playerName: 'Player1' };
      const player2 = { playerId: 2, playerName: 'Player2' };

      await request(app).post('/api/game/player-join').send(player1);
      const response = await request(app).post('/api/game/player-join').send(player2);

      expect(response.body.serverInfo.activePlayers).toBe(2);
    });
  });

  describe('POST /api/game/player-quit', () => {
    beforeEach(async () => {
      // Add a player first
      await request(app)
        .post('/api/game/player-join')
        .send({ playerId: 1, playerName: 'TestPlayer' });
    });

    it('should handle player quit', async () => {
      const quitData = {
        playerId: 1,
        playerName: 'TestPlayer',
        exitType: 'disconnect',
        reason: 'network timeout',
      };

      const response = await request(app)
        .post('/api/game/player-quit')
        .send(quitData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Player quit processed',
      });

      expect(response.body.sessionInfo).toBeDefined();
      expect(response.body.sessionInfo.exitType).toBe('disconnect');
    });

    it('should handle quit without session', async () => {
      const quitData = {
        playerId: 999,
        playerName: 'NonExistentPlayer',
      };

      const response = await request(app)
        .post('/api/game/player-quit')
        .send(quitData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.sessionInfo).toBeNull();
    });
  });

  describe('POST /api/game/chat', () => {
    beforeEach(async () => {
      // Add a player first
      await request(app)
        .post('/api/game/player-join')
        .send({ playerId: 1, playerName: 'TestPlayer' });
    });

    it('should handle regular chat message', async () => {
      const chatData = {
        playerId: 1,
        playerName: 'TestPlayer',
        message: 'Hello everyone!',
      };

      const response = await request(app)
        .post('/api/game/chat')
        .send(chatData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        type: 'chat',
        message: 'Chat processed',
      });

      expect(response.body.aiResponse).toBeNull();
    });

    it('should trigger AI response for AI mentions', async () => {
      const chatData = {
        playerId: 1,
        playerName: 'TestPlayer',
        message: '@ai What is the weather like?',
      };

      const response = await request(app)
        .post('/api/game/chat')
        .send(chatData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.aiResponse).toBeDefined();
      expect(typeof response.body.aiResponse).toBe('string');
      expect(response.body.aiResponse).toContain('TestPlayer');
    });

    describe('Command Handling', () => {
      it('should handle /help command', async () => {
        const chatData = {
          playerId: 1,
          playerName: 'TestPlayer',
          message: '/help',
        };

        const response = await request(app)
          .post('/api/game/chat')
          .send(chatData)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          type: 'command',
          command: 'help',
        });

        expect(response.body.response).toContain('Available commands');
      });

      it('should handle /ai command', async () => {
        const chatData = {
          playerId: 1,
          playerName: 'TestPlayer',
          message: '/ai Hello there!',
        };

        const response = await request(app)
          .post('/api/game/chat')
          .send(chatData)
          .expect(200);

        expect(response.body.type).toBe('command');
        expect(response.body.command).toBe('ai');
        expect(response.body.response).toContain('🤖 AI:');
        expect(response.body.response).toContain('TestPlayer');
      });

      it('should handle /status command', async () => {
        const chatData = {
          playerId: 1,
          playerName: 'TestPlayer',
          message: '/status',
        };

        const response = await request(app)
          .post('/api/game/chat')
          .send(chatData)
          .expect(200);

        expect(response.body.command).toBe('status');
        expect(response.body.response).toContain('Server Status');
        expect(response.body.response).toContain('players online');
      });

      it('should handle /players command', async () => {
        // Add another player
        await request(app)
          .post('/api/game/player-join')
          .send({ playerId: 2, playerName: 'Player2' });

        const chatData = {
          playerId: 1,
          playerName: 'TestPlayer',
          message: '/players',
        };

        const response = await request(app)
          .post('/api/game/chat')
          .send(chatData)
          .expect(200);

        expect(response.body.command).toBe('players');
        expect(response.body.response).toContain('Online players');
        expect(response.body.response).toContain('TestPlayer');
        expect(response.body.response).toContain('Player2');
      });

      it('should handle unknown command', async () => {
        const chatData = {
          playerId: 1,
          playerName: 'TestPlayer',
          message: '/unknown',
        };

        const response = await request(app)
          .post('/api/game/chat')
          .send(chatData)
          .expect(200);

        expect(response.body.command).toBe('unknown');
        expect(response.body.response).toContain('Unknown command: /unknown');
      });

      it('should handle /ai command without message', async () => {
        const chatData = {
          playerId: 1,
          playerName: 'TestPlayer',
          message: '/ai',
        };

        const response = await request(app)
          .post('/api/game/chat')
          .send(chatData)
          .expect(200);

        expect(response.body.response).toContain('Usage: /ai <message>');
      });
    });

    it('should reject invalid chat data', async () => {
      const invalidData = {
        playerId: 1,
        playerName: 'TestPlayer',
        message: '', // Empty message should be rejected
      };

      await request(app)
        .post('/api/game/chat')
        .send(invalidData)
        .expect(400);
    });
  });

  describe('AI Response Generation', () => {
    it('should generate varied AI responses', async () => {
      const responses = new Set();
      
      // Generate multiple responses to test variety
      for (let i = 0; i < 10; i++) {
        const chatData = {
          playerId: 1,
          playerName: 'TestPlayer',
          message: `@ai Test message ${i}`,
        };

        const response = await request(app)
          .post('/api/game/chat')
          .send(chatData);

        responses.add(response.body.aiResponse);
      }

      // Should have some variety in responses (at least 2 different responses)
      expect(responses.size).toBeGreaterThan(1);
    });
  });

  describe('Session Management', () => {
    it('should track session activity', async () => {
      // Join player
      await request(app)
        .post('/api/game/player-join')
        .send({ playerId: 1, playerName: 'TestPlayer' });

      // Send chat (updates activity)
      await request(app)
        .post('/api/game/chat')
        .send({
          playerId: 1,
          playerName: 'TestPlayer',
          message: 'Hello!',
        });

      // Quit player
      const quitResponse = await request(app)
        .post('/api/game/player-quit')
        .send({
          playerId: 1,
          playerName: 'TestPlayer',
        });

      expect(quitResponse.body.sessionInfo).toBeDefined();
      expect(quitResponse.body.sessionInfo.duration).toBeGreaterThan(0);
    });

    it('should remove player from active sessions on quit', async () => {
      // Join two players
      await request(app)
        .post('/api/game/player-join')
        .send({ playerId: 1, playerName: 'Player1' });
      
      await request(app)
        .post('/api/game/player-join')
        .send({ playerId: 2, playerName: 'Player2' });

      // Quit one player
      await request(app)
        .post('/api/game/player-quit')
        .send({ playerId: 1, playerName: 'Player1' });

      // Check players command shows only remaining player
      const chatResponse = await request(app)
        .post('/api/game/chat')
        .send({
          playerId: 2,
          playerName: 'Player2',
          message: '/players',
        });

      expect(chatResponse.body.response).toContain('Player2');
      expect(chatResponse.body.response).not.toContain('Player1');
    });
  });
});
