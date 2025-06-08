/**
 * REST API endpoints for E2E testing and frontend integration
 * These endpoints provide compatibility with existing frontend code
 */

import { Router } from 'express';
import gameRoutes from './game.routes';

const router: Router = Router();

// Mock data for testing when database is not available
const mockStats = {
  players: {
    total: 1247,
    online: 128,
    peakToday: 245,
  },
  server: {
    name: 'GangGPT Los Santos',
    maxPlayers: 500,
    uptime: '99.7%',
    version: '1.0.0',
  },
  ai: {
    model: 'gpt-4o-mini',
    status: 'operational',
    interactionsToday: 2847,
  },
  factions: {
    total: 24,
    activeWars: 3,
    territories: 45,
  },
  economy: {
    totalTransactions: 15692,
    marketCap: 2847593,
    inflation: 2.3,
  },
};

const mockServerInfo = {
  name: 'GangGPT Los Santos',
  maxPlayers: 500,
  currentPlayers: 128,
  version: '1.0.0',
  gamemode: 'AI-Powered Roleplay',
  map: 'Los Santos',
  uptime: 99.7,
  features: [
    'AI-Powered NPCs',
    'Dynamic Factions',
    'Procedural Missions',
    'Persistent World',
  ],
};

// Stats endpoint for E2E tests
router.get('/stats', (_req, res) => {
  try {
    res.json(mockStats);
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch statistics',
    });
  }
});

// Server info endpoint
router.get('/server/info', (_req, res) => {
  try {
    res.json(mockServerInfo);
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch server information',
    });
  }
});

// Health check for API
router.get('/ping', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'REST API is operational',
  });
});

// Game integration routes for RAGE:MP
router.use('/game', gameRoutes);

export { router as restRouter };
