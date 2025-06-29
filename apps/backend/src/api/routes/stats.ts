import { publicProcedure, router } from '../trpc';
import { PlayerService } from '../../modules/players/player.service';
import { FactionService } from '../../modules/factions/faction.service';
import { WorldService } from '../../modules/world/world.service';
import { EconomyService } from '../../modules/economy/economy.service';
import { cache } from '../../infrastructure/cache';
import { RageMPManager } from '../../infrastructure/ragemp/ragemp.manager';
import config from '../../config';
import { DatabaseService } from '../../infrastructure/database';

export const statsRouter = router({
  getAll: publicProcedure.query(async () => {
    // Get database instance
    const db = DatabaseService.getInstance();
    // Create service instances
    const playerService = new PlayerService(db.prisma);
    const factionService = new FactionService(db.prisma);
    const worldService = new WorldService(db.prisma);
    const economyService = new EconomyService(db.prisma);
    // Create RageMPManager instance
    const ragempManager = new RageMPManager();

    return {
      players: {
        total: await playerService.getTotalPlayers(),
        online: ragempManager.getOnlinePlayers().length,
      },
      factions: {
        total: await factionService.getTotalFactions(),
        activeEvents: 0,
      },
      world: {
        territories: worldService.getAllTerritories().length,
        activeEvents: worldService.getActiveEvents().length,
        stats: worldService.getWorldStats(),
      },
      economy: {
        marketItems: economyService.getAllMarketItems().length,
        indicators: economyService.getEconomicIndicators(),
        stats: economyService.getEconomyStats(),
      },
      server: await ragempManager.getServerStats(),
      ai: {
        model: config.ai.deploymentName,
        status: 'operational',
      },
      cache: await cache.getStats(),
    };
  }),
});
