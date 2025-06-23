import { Router, type Request, type Response } from 'express';
import { logger } from '@/infrastructure/logging';
import { validateInput } from '../../shared/middleware/validation.middleware';
import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const router: Router = Router();

// Validation schemas
const playerJoinSchema = z.object({
  playerId: z.number(),
  playerName: z.string().min(1).max(50),
  socialClub: z.string().optional(),
  ip: z.string().optional(),
});

const playerQuitSchema = z.object({
  playerId: z.number(),
  playerName: z.string(),
  exitType: z.string().optional(),
  reason: z.string().optional(),
});

const chatSchema = z.object({
  playerId: z.number(),
  playerName: z.string(),
  message: z.string().min(1).max(500),
  type: z.string().optional(),
});

/**
 * Handle player join events from RAGE:MP
 */
router.post(
  '/player-join',
  validateInput(playerJoinSchema),
  async (req: Request, res: Response) => {
    try {
      const { playerId, playerName, ip } = req.body;

      logger.info(
        `🎮 Game API: Player ${playerName} (ID: ${playerId}) joined${ip ? ` from ${ip}` : ''}`
      );

      // TODO: Implement player session management
      // TODO: Load player data from database
      // TODO: Initialize player state in world service

      res.json({
        success: true,
        message: `Welcome to GangGPT, ${playerName}!`,
        playerData: {
          id: playerId,
          name: playerName,
          joinTime: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Error handling player join:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process player join',
      });
    }
  }
);

/**
 * Handle player quit events from RAGE:MP
 */
router.post(
  '/player-quit',
  validateInput(playerQuitSchema),
  async (req: Request, res: Response) => {
    try {
      const { playerId, playerName, exitType, reason } = req.body;

      logger.info(
        `🎮 Game API: Player ${playerName} (ID: ${playerId}) quit (${exitType}: ${reason})`
      );

      // TODO: Save player session data
      // TODO: Clean up player state from world service
      // TODO: Handle faction/territory updates

      res.json({
        success: true,
        message: 'Player quit processed',
      });
    } catch (error) {
      logger.error('Error handling player quit:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process player quit',
      });
    }
  }
);

/**
 * Handle chat messages from RAGE:MP
 */
router.post(
  '/chat',
  validateInput(chatSchema),
  async (req: Request, res: Response) => {
    try {
      const { playerId, playerName, message } = req.body;

      logger.info(`🎮 Game Chat: ${playerName} (${playerId}): ${message}`);

      // Check if message is a command
      if (message.startsWith('/')) {
        // TODO: Handle in-game commands
        res.json({
          success: true,
          type: 'command',
          message: 'Command processed',
        });
        return;
      }

      // Process regular chat for AI interaction
      // TODO: Implement AI chat processing
      // TODO: Check for NPC mentions or proximity
      // TODO: Generate AI responses based on context

      res.json({
        success: true,
        type: 'chat',
        message: 'Chat processed',
      });
    } catch (error) {
      logger.error('Error handling chat:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process chat',
      });
    }
  }
);

/**
 * Handle AI chat from RAGE:MP players
 */
const aiChatSchema = z.object({
  playerId: z.number(),
  playerName: z.string(),
  message: z.string().min(1).max(500),
});

router.post(
  '/ai-chat',
  validateInput(aiChatSchema),
  async (req: Request, res: Response) => {
    try {
      const { playerId, playerName, message } = req.body;

      logger.info(`🤖 AI Chat: ${playerName} (${playerId}): ${message}`);

      // TODO: Implement actual AI chat using OpenAI GPT-4o-mini
      // For now, provide a basic response
      const responses = [
        "Welcome to GangGPT! I'm your AI companion. How can I help you in Los Santos?",
        'I can help you with missions, faction information, or just have a conversation!',
        "That's interesting! Tell me more about what you'd like to do in the city.",
        "I see you're exploring the world. Would you like me to suggest some activities?",
        "The streets of Los Santos are always full of opportunities. What's your next move?",
      ];

      const reply = responses[Math.floor(Math.random() * responses.length)];

      res.json({
        success: true,
        reply,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error processing AI chat:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process AI chat',
      });
    }
  }
);

/**
 * Get current game state for RAGE:MP
 */
router.get('/state', async (_req: Request, res: Response) => {
  try {
    // TODO: Get current world state
    // TODO: Get active players
    // TODO: Get faction information
    // TODO: Get territory control data

    res.json({
      success: true,
      state: {
        timestamp: new Date().toISOString(),
        players: [],
        territories: [],
        factions: [],
        economy: {},
      },
    });
  } catch (error) {
    logger.error('Error getting game state:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get game state',
    });
  }
});

/**
 * Update game world state from RAGE:MP
 */
router.post('/state', async (req: Request, res: Response) => {
  try {
    const { type } = req.body;

    logger.info(`🎮 Game API: Received state update of type: ${type}`);

    // TODO: Process different types of state updates
    // TODO: Update world service
    // TODO: Broadcast changes to other systems

    res.json({
      success: true,
      message: 'State updated',
    });
  } catch (error) {
    logger.error('Error updating game state:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update game state',
    });
  }
});

/**
 * Launch RAGE:MP client and connect to GangGPT server
 */
router.post(
  '/launch-client',
  async (_req: Request, res: Response): Promise<void> => {
    try {
      logger.info(
        '🎮 Game API: Launching RAGE:MP client for GangGPT via updater'
      );

      // Check for existing RAGE:MP processes first
      try {
        const processCheck = await execAsync(
          'tasklist /FI "IMAGENAME eq updater.exe" /FO CSV 2>NUL | find /C "updater.exe"'
        );
        const updaterCount = parseInt(processCheck.stdout.trim());

        const clientCheck = await execAsync(
          'tasklist /FI "IMAGENAME eq ragemp_v.exe" /FO CSV 2>NUL | find /C "ragemp_v.exe"'
        );
        const clientCount = parseInt(clientCheck.stdout.trim());

        if (updaterCount > 0 || clientCount > 0) {
          logger.warn(
            `⚠️ Found existing RAGE:MP processes: ${updaterCount} updater(s), ${clientCount} client(s)`
          );
          res.status(409).json({
            success: false,
            error: 'RAGE:MP already running',
            message:
              'RAGE:MP is already running. Close existing instances before launching again.',
            existingProcesses: {
              updater: updaterCount,
              client: clientCount,
            },
          });
          return;
        }
      } catch (processError) {
        logger.warn(
          '⚠️ Process check failed, but continuing with launch attempt'
        );
      }

      // First, verify that the RAGE:MP server is running and listening
      try {
        const netstatOutput = await execAsync('netstat -an | findstr "22005"');
        if (!netstatOutput.stdout.includes('22005')) {
          res.status(503).json({
            success: false,
            error: 'RAGE:MP server not running',
            message: 'Please start the RAGE:MP server first (port 22005)',
            serverAddress: 'localhost:22005',
          });
          return;
        }
        logger.info('✅ RAGE:MP server is running on port 22005');
      } catch (portError) {
        logger.warn('⚠️ Port check failed, but continuing with launch attempt');
      }

      // Common RAGE:MP updater paths
      const commonPaths = [
        'C:\\RAGEMP\\updater.exe',
        'C:\\RageMP\\updater.exe',
        'C:\\Program Files\\RAGE Multiplayer\\updater.exe',
        'C:\\Program Files (x86)\\RAGE Multiplayer\\updater.exe',
      ];

      let updaterPath = '';

      // Check for existing RAGE:MP updater installation
      for (const testPath of commonPaths) {
        try {
          const checkResult = await execAsync(
            `if exist "${testPath}" echo exists`
          );
          if (checkResult.stdout.includes('exists')) {
            updaterPath = testPath;
            break;
          }
        } catch {
          continue;
        }
      }

      if (!updaterPath) {
        res.status(404).json({
          success: false,
          error: 'RAGE:MP updater not found',
          message:
            'Please download and install RAGE:MP client from https://rage.mp/',
          downloadUrl: 'https://rage.mp/',
        });
        return;
      }

      // Launch RAGE:MP via updater with correct connect parameter
      // RAGE:MP updater expects the format: ragemp://ip:port/
      const connectCommand = `"${updaterPath}" ragemp://localhost:22005/`;

      logger.info(`🎮 Executing: ${connectCommand}`);

      // Launch in background with improved error handling
      const launchProcess = exec(connectCommand, (error, stdout, stderr) => {
        if (error) {
          logger.warn(`RAGE:MP updater launch warning: ${error.message}`);
          if (stderr) {
            logger.warn(`RAGE:MP updater stderr: ${stderr}`);
          }
        } else {
          logger.info('🎮 RAGE:MP updater launched successfully');
          if (stdout) {
            logger.info(`RAGE:MP updater stdout: ${stdout}`);
          }
        }
      });

      // Set timeout for process
      setTimeout(() => {
        if (launchProcess && !launchProcess.killed) {
          logger.info('🎮 RAGE:MP launch process is running');
        }
      }, 3000);

      res.json({
        success: true,
        message: 'RAGE:MP launching and connecting to server...',
        serverAddress: 'localhost:22005',
        clientPath: updaterPath,
        instructions: [
          'RAGE:MP client is starting...',
          'If prompted, allow the updater to run',
          'The game will auto-connect to the server',
          'Use /ai [message] in-game to test AI features',
        ],
      });
    } catch (error) {
      logger.error('Error launching RAGE:MP via updater:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to launch RAGE:MP updater',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * Check RAGE:MP client installation status
 */
router.get(
  '/client-status',
  async (_req: Request, res: Response): Promise<void> => {
    try {
      logger.info('🎮 Game API: Checking RAGE:MP updater status');

      const commonPaths = [
        'C:\\RAGEMP\\updater.exe',
        'C:\\RageMP\\updater.exe',
        'C:\\Program Files\\RAGE Multiplayer\\updater.exe',
        'C:\\Program Files (x86)\\RAGE Multiplayer\\updater.exe',
      ];

      let foundUpdater = false;
      let updaterPath = '';

      for (const testPath of commonPaths) {
        try {
          await execAsync(`if exist "${testPath}" echo exists`);
          foundUpdater = true;
          updaterPath = testPath;
          break;
        } catch {
          continue;
        }
      }

      res.json({
        success: true,
        clientInstalled: foundUpdater,
        clientPath: foundUpdater ? updaterPath : null,
        downloadUrl: 'https://rage.mp/',
        serverAddress: 'localhost:22005',
      });
    } catch (error) {
      logger.error('Error checking RAGE:MP updater status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check updater status',
      });
    }
  }
);

export default router;
