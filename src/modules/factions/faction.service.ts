import { PrismaClient, Faction } from '@prisma/client';
import { logger } from '../../infrastructure/logging';
import { aiService } from '../ai';

// Define enums locally until Prisma types are available
enum FactionType {
  GANG = 'GANG',
  MAFIA = 'MAFIA',
  CARTEL = 'CARTEL',
  BIKER_CLUB = 'BIKER_CLUB',
  CORPORATION = 'CORPORATION',
  LAW_ENFORCEMENT = 'LAW_ENFORCEMENT',
  GOVERNMENT = 'GOVERNMENT',
  CIVILIAN = 'CIVILIAN',
}

enum FactionRank {
  RECRUIT = 'RECRUIT',
  MEMBER = 'MEMBER',
  VETERAN = 'VETERAN',
  LIEUTENANT = 'LIEUTENANT',
  CAPTAIN = 'CAPTAIN',
  UNDERBOSS = 'UNDERBOSS',
  LEADER = 'LEADER',
}

enum EventType {
  TERRITORY_GAINED = 'TERRITORY_GAINED',
  TERRITORY_LOST = 'TERRITORY_LOST',
  MEMBER_JOINED = 'MEMBER_JOINED',
  MEMBER_LEFT = 'MEMBER_LEFT',
  WAR_DECLARED = 'WAR_DECLARED',
  WAR_ENDED = 'WAR_ENDED',
  ALLIANCE_FORMED = 'ALLIANCE_FORMED',
  ALLIANCE_BROKEN = 'ALLIANCE_BROKEN',
  BUSINESS_ACQUIRED = 'BUSINESS_ACQUIRED',
  BUSINESS_LOST = 'BUSINESS_LOST',
}

interface CreateFactionData {
  name: string;
  description?: string;
  type: FactionType;
  color: string;
  leaderId: string;
  territory?: object;
}

interface FactionAIDecision {
  action: string;
  reasoning: string;
  confidence: number;
  expectedOutcome: string;
}

export class FactionService {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient) {
    this.prisma = prismaClient;
  }

  async createFaction(data: CreateFactionData): Promise<Faction> {
    try {
      const faction = await this.prisma.faction.create({
        data: {
          name: data.name,
          description: data.description || null,
          type: data.type,
          color: data.color,
          leaderId: data.leaderId,
          territory: JSON.stringify(data.territory || {}),
          aiPersonality: JSON.stringify(this.generateAIPersonality(data.type)),
        },
      });

      // Create faction membership for leader
      await this.prisma.factionMembership.create({
        data: {
          characterId: data.leaderId,
          factionId: faction.id,
          rank: FactionRank.LEADER,
        },
      });

      logger.info('Faction created successfully', {
        factionId: faction.id,
        factionName: faction.name,
        type: faction.type,
        leaderId: data.leaderId,
      });

      return faction;
    } catch (error) {
      logger.error('Failed to create faction', {
        error: error instanceof Error ? error.message : 'Unknown error',
        factionName: data.name,
      });
      throw error;
    }
  }

  async addMemberToFaction(
    characterId: string,
    factionId: string,
    rank: FactionRank = FactionRank.MEMBER
  ): Promise<{ success: boolean; membership?: any; error?: string }> {
    try {
      // Check if character is already in a faction
      const existingMembership = await this.prisma.factionMembership.findFirst({
        where: {
          characterId,
          isActive: true,
        },
      });

      if (existingMembership) {
        throw new Error('Character is already in a faction');
      }

      const member = await this.prisma.factionMembership.create({
        data: {
          characterId,
          factionId,
          rank: rank as string,
        },
      });

      // Log faction event
      await this.prisma.factionEvent.create({
        data: {
          factionId,
          type: EventType.MEMBER_JOINED,
          description: `New member joined the faction with rank ${rank}`,
          data: JSON.stringify({ characterId, rank }),
        },
      });

      logger.info('Member added to faction successfully', {
        characterId,
        factionId,
        rank,
      });

      return { success: true, membership: member };
    } catch (error) {
      logger.error('Failed to add member to faction', {
        error: error instanceof Error ? error.message : 'Unknown error',
        characterId,
        factionId,
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async removeMemberFromFaction(characterId: string, factionId: string) {
    try {
      await this.prisma.factionMembership.updateMany({
        where: {
          characterId,
          factionId,
        },
        data: {
          isActive: false,
        },
      });

      // Log faction event
      await this.prisma.factionEvent.create({
        data: {
          factionId,
          type: EventType.MEMBER_LEFT,
          description: `Member left the faction`,
          data: JSON.stringify({ characterId }),
        },
      });

      logger.info('Member removed from faction successfully', {
        characterId,
        factionId,
      });
    } catch (error) {
      logger.error('Failed to remove member from faction', {
        error: error instanceof Error ? error.message : 'Unknown error',
        characterId,
        factionId,
      });
      throw error;
    }
  }

  async updateFactionInfluence(factionId: string, influenceChange: number) {
    try {
      const faction = await this.prisma.faction.update({
        where: { id: factionId },
        data: {
          influence: {
            increment: influenceChange,
          },
        },
      });

      logger.info('Faction influence updated', {
        factionId,
        influenceChange,
        newInfluence: faction.influence,
      });

      return faction;
    } catch (error) {
      logger.error('Failed to update faction influence', {
        error: error instanceof Error ? error.message : 'Unknown error',
        factionId,
        influenceChange,
      });
      throw error;
    }
  }

  async getFactionById(factionId: string) {
    try {
      const faction = await this.prisma.faction.findUnique({
        where: { id: factionId },
        include: {
          members: {
            where: { isActive: true },
            include: {
              character: {
                include: {
                  user: true,
                },
              },
            },
          },
          wars: true,
          targetWars: true,
          events: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      });

      return faction;
    } catch (error) {
      logger.error('Failed to get faction', {
        error: error instanceof Error ? error.message : 'Unknown error',
        factionId,
      });
      throw error;
    }
  }

  async getAllFactions() {
    try {
      const factions = await this.prisma.faction.findMany({
        where: {
          isActive: true,
          deletedAt: null,
        },
        include: {
          members: {
            where: { isActive: true },
            include: {
              character: true,
            },
          },
        },
      });

      return factions;
    } catch (error) {
      logger.error('Failed to get all factions', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async getTotalFactions(): Promise<number> {
    try {
      const count = await this.prisma.faction.count({
        where: {
          isActive: true,
          deletedAt: null,
        },
      });

      logger.info('Retrieved total factions count', { count });
      return count;
    } catch (error) {
      logger.error('Failed to get total factions count', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async processAIDecisions() {
    try {
      const factions = await this.getAllFactions();

      for (const faction of factions) {
        const memberCount = faction.members.length;
        const context = this.buildFactionContext(faction, memberCount);

        const decision = await this.makeAIDecision(faction.id, context);

        if (decision) {
          await this.executeAIDecision(faction.id, decision);
        }

        // Brief delay between faction decisions
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      logger.info('AI faction decisions processed', {
        factionsProcessed: factions.length,
      });
    } catch (error) {
      logger.error('Failed to process AI faction decisions', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  private buildFactionContext(faction: any, memberCount: number): string {
    return `
      Faction: ${faction.name}
      Type: ${faction.type}
      Influence: ${faction.influence}
      Members: ${memberCount}
      Territory: ${JSON.stringify(faction.territory)}
      Recent Events: ${this.formatRecentEvents(faction.events)}
    `;
  }

  private async makeAIDecision(
    factionId: string,
    context: string
  ): Promise<FactionAIDecision | null> {
    try {
      const prompt = `
        As the AI decision-maker for this faction, analyze the current situation and decide on the next action.
        
        Context:
        ${context}
        
        Possible actions:
        - EXPAND_TERRITORY: Try to expand territorial control
        - RECRUIT_MEMBERS: Focus on recruiting new members
        - FORM_ALLIANCE: Seek alliances with other factions
        - DECLARE_WAR: Start conflict with rival factions
        - STRENGTHEN_DEFENSES: Improve faction defenses
        - ECONOMIC_FOCUS: Focus on economic activities
        - LAY_LOW: Maintain status quo and avoid attention
        
        Respond with a JSON object containing:
        {
          "action": "ACTION_NAME",
          "reasoning": "Brief explanation",
          "confidence": 0.7,
          "expectedOutcome": "What you expect to happen"
        }
      `;
      const response = await aiService.generateCompanionResponse(
        'FACTION_AI',
        prompt,
        {
          factionId,
        }
      );

      // Parse AI response
      try {
        const decision = JSON.parse(response.content) as FactionAIDecision;
        return decision;
      } catch (parseError) {
        logger.warn('Failed to parse AI decision response', {
          factionId,
          response: response.content,
        });
        return null;
      }
    } catch (error) {
      logger.error('Failed to get AI decision', {
        error: error instanceof Error ? error.message : 'Unknown error',
        factionId,
      });
      return null;
    }
  }

  private async executeAIDecision(
    factionId: string,
    decision: FactionAIDecision
  ) {
    try {
      // Log the AI decision as a faction event
      await this.prisma.factionEvent.create({
        data: {
          factionId,
          type: EventType.MEMBER_JOINED, // Using existing enum value, ideally we'd have AI_DECISION
          description: `AI Decision: ${decision.action} - ${decision.reasoning}`,
          data: decision as any,
        },
      });

      // Execute the decision based on action type
      switch (decision.action) {
        case 'EXPAND_TERRITORY':
          await this.updateFactionInfluence(factionId, 2);
          break;
        case 'RECRUIT_MEMBERS':
          // In a real implementation, this might trigger recruitment events
          break;
        case 'FORM_ALLIANCE':
          // This would involve complex faction relationship logic
          break;
        case 'DECLARE_WAR':
          // This would start a faction war
          break;
        case 'STRENGTHEN_DEFENSES':
          await this.updateFactionInfluence(factionId, 1);
          break;
        case 'ECONOMIC_FOCUS':
          // This might affect faction resources
          break;
        case 'LAY_LOW':
          // No immediate action needed
          break;
      }

      logger.info('AI decision executed', {
        factionId,
        action: decision.action,
        confidence: decision.confidence,
      });
    } catch (error) {
      logger.error('Failed to execute AI decision', {
        error: error instanceof Error ? error.message : 'Unknown error',
        factionId,
        decision,
      });
      throw error;
    }
  }

  private formatRecentEvents(events: any[]): string {
    if (!events || events.length === 0) {
      return 'No recent events';
    }

    return events
      .map(event => `${event.type}: ${event.description}`)
      .join('; ');
  }

  private generateAIPersonality(factionType: FactionType): {
    aggression: number;
    loyalty: number;
    riskTolerance: number;
    economicFocus: number;
    territorialAmbition: number;
    traits: string[];
  } {
    const personalities = {
      [FactionType.GANG]: {
        aggression: 0.8,
        loyalty: 0.7,
        riskTolerance: 0.9,
        economicFocus: 0.6,
        territorialAmbition: 0.8,
        traits: ['aggressive', 'street-smart', 'territorial'],
      },
      [FactionType.MAFIA]: {
        aggression: 0.6,
        loyalty: 0.9,
        riskTolerance: 0.5,
        economicFocus: 0.8,
        territorialAmbition: 0.7,
        traits: ['strategic', 'family-oriented', 'business-minded'],
      },
      [FactionType.CARTEL]: {
        aggression: 0.7,
        loyalty: 0.6,
        riskTolerance: 0.8,
        economicFocus: 0.9,
        territorialAmbition: 0.6,
        traits: ['profit-driven', 'international', 'ruthless'],
      },
      [FactionType.BIKER_CLUB]: {
        aggression: 0.8,
        loyalty: 0.8,
        riskTolerance: 0.7,
        economicFocus: 0.5,
        territorialAmbition: 0.6,
        traits: ['freedom-loving', 'brotherhood', 'rebellious'],
      },
      [FactionType.CORPORATION]: {
        aggression: 0.3,
        loyalty: 0.4,
        riskTolerance: 0.4,
        economicFocus: 0.9,
        territorialAmbition: 0.5,
        traits: ['profit-focused', 'corporate', 'legal'],
      },
      [FactionType.LAW_ENFORCEMENT]: {
        aggression: 0.5,
        loyalty: 0.8,
        riskTolerance: 0.3,
        economicFocus: 0.3,
        territorialAmbition: 0.4,
        traits: ['law-abiding', 'protective', 'structured'],
      },
      [FactionType.GOVERNMENT]: {
        aggression: 0.4,
        loyalty: 0.6,
        riskTolerance: 0.2,
        economicFocus: 0.6,
        territorialAmbition: 0.3,
        traits: ['bureaucratic', 'political', 'regulatory'],
      },
      [FactionType.CIVILIAN]: {
        aggression: 0.2,
        loyalty: 0.5,
        riskTolerance: 0.3,
        economicFocus: 0.7,
        territorialAmbition: 0.2,
        traits: ['peaceful', 'community-minded', 'defensive'],
      },
    };

    const result =
      personalities[factionType] || personalities[FactionType.CIVILIAN];
    return result;
  }
}
