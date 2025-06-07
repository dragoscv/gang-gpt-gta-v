/**
 * Main tRPC API router
 * Combines all feature routers into a single API
 */

import { router, publicProcedure } from './trpc';
import { authRouter } from './routes/auth';
import { statsRouter } from './routes/stats';

// Simple health router for monitoring
const healthRouter = router({
  ping: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
});

/**
 * Main application router
 * Add new feature routers here as they are created
 */
export const appRouter = router({
  health: healthRouter,
  auth: authRouter,
  stats: statsRouter,
  // Additional routers will be added as features are implemented:
  // players: playersRouter,
  // factions: factionsRouter,
  // missions: missionsRouter,
  // ai: aiRouter,
  // economy: economyRouter,
  // world: worldRouter,
});

export type AppRouter = typeof appRouter;
