/**
 * Advanced Memory MCP Integration
 * Enhanced memory management with semantic search and context awareness
 */

import { logger } from '../../infrastructure/logging';
import config from '../../config';

export interface MemoryContext {
  agentId: string;
  sessionId?: string;
  userId?: string;
  contextType: 'conversation' | 'game_session' | 'faction_activity' | 'player_interaction';
  metadata?: Record<string, any>;
}

export interface MemoryEntry {
  id: string;
  content: string;
  context: MemoryContext;
  importance: number; // 1-10 scale
  tags: string[];
  timestamp: Date;
  embedVector?: number[];
  relatedMemories?: string[];
}

export interface MemorySearchOptions {
  query: string;
  limit?: number;
  contextFilter?: Partial<MemoryContext>;
  minImportance?: number;
  timeRange?: {
    start?: Date;
    end?: Date;
  };
  semanticThreshold?: number;
}

export interface MemoryAnalytics {
  totalMemories: number;
  contextDistribution: Record<string, number>;
  averageImportance: number;
  topTags: Array<{ tag: string; count: number }>;
  memoryGrowthRate: number;
  retrievalPatterns: Record<string, number>;
}

export class AdvancedMemoryMCP {
  private memoryStore: Map<string, MemoryEntry> = new Map();
  private contextIndex: Map<string, Set<string>> = new Map();
  private tagIndex: Map<string, Set<string>> = new Map();
  private userSessions: Map<string, string[]> = new Map();
  private analytics: MemoryAnalytics = {
    totalMemories: 0,
    contextDistribution: {},
    averageImportance: 0,
    topTags: [],
    memoryGrowthRate: 0,
    retrievalPatterns: {},
  };

  constructor(private mcpEndpoint?: string) {
    this.initializeMemorySystem();
  }

  /**
   * Initialize the memory system with MCP integration
   */
  private async initializeMemorySystem(): Promise<void> {
    try {
      logger.info('Initializing Advanced Memory MCP System');
      
      // Connect to MCP server if endpoint provided
      if (this.mcpEndpoint) {
        await this.connectToMCP();
      }

      // Load existing memories from persistent storage
      await this.loadPersistedMemories();

      // Initialize memory cleanup scheduler
      this.scheduleMemoryMaintenance();

      logger.info('Advanced Memory MCP System initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Memory MCP System', { error });
      throw error;
    }
  }

  /**
   * Store a new memory with enhanced context awareness
   */
  async remember(
    content: string,
    context: MemoryContext,
    importance: number = 5,
    tags: string[] = []
  ): Promise<string> {
    try {
      const memoryId = this.generateMemoryId();
      const enhancedTags = await this.enhanceTagsWithAI(content, tags);
      const relatedMemories = await this.findRelatedMemories(content, context);

      const memory: MemoryEntry = {
        id: memoryId,
        content,
        context,
        importance: Math.max(1, Math.min(10, importance)),
        tags: enhancedTags,
        timestamp: new Date(),
        relatedMemories: relatedMemories.slice(0, 5), // Limit to top 5 related
      };

      // Generate semantic embedding if AI is available
      if (config.features.aiCompanions) {
        const embedding = await this.generateEmbedding(content);
        if (embedding) {
          memory.embedVector = embedding;
        }
      }

      // Store memory
      this.memoryStore.set(memoryId, memory);

      // Update indexes
      this.updateIndexes(memory);

      // Update analytics
      this.updateAnalytics(memory);

      // Persist to MCP if connected
      if (this.mcpEndpoint) {
        await this.persistToMCP(memory);
      }

      logger.debug('Memory stored', {
        memoryId,
        contextType: context.contextType,
        importance,
        tags: enhancedTags,
      });

      return memoryId;
    } catch (error) {
      logger.error('Failed to store memory', { error, content: content.substring(0, 100) });
      throw error;
    }
  }

  /**
   * Recall memories with advanced semantic search
   */
  async recall(options: MemorySearchOptions): Promise<MemoryEntry[]> {
    try {
      const {
        query,
        limit = 10,
        contextFilter,
        minImportance = 1,
        timeRange,
        semanticThreshold = 0.7,
      } = options;

      let candidates = Array.from(this.memoryStore.values());

      // Apply filters
      if (contextFilter) {
        candidates = candidates.filter(memory => 
          this.matchesContext(memory.context, contextFilter)
        );
      }

      if (minImportance > 1) {
        candidates = candidates.filter(memory => memory.importance >= minImportance);
      }

      if (timeRange) {
        candidates = candidates.filter(memory => {
          const timestamp = memory.timestamp;
          return (!timeRange.start || timestamp >= timeRange.start) &&
                 (!timeRange.end || timestamp <= timeRange.end);
        });
      }

      // Semantic search with embeddings
      if (config.features.aiCompanions && candidates.length > 0) {
        const queryEmbedding = await this.generateEmbedding(query);
        if (queryEmbedding) {
          candidates = candidates
            .map(memory => ({
              memory,
              similarity: this.calculateCosineSimilarity(queryEmbedding, memory.embedVector || []),
            }))
            .filter(({ similarity }) => similarity >= semanticThreshold)
            .sort((a, b) => b.similarity - a.similarity)
            .map(({ memory }) => memory);
        }
      }

      // Fallback to keyword search if semantic search unavailable
      if (!config.features.aiCompanions || candidates.length === 0) {
        candidates = this.performKeywordSearch(query, candidates);
      }

      // Apply importance-based ranking
      candidates.sort((a, b) => {
        const importanceWeight = (b.importance - a.importance) * 0.3;
        const recencyWeight = (b.timestamp.getTime() - a.timestamp.getTime()) * 0.0000001;
        return importanceWeight + recencyWeight;
      });

      // Update retrieval analytics
      this.updateRetrievalAnalytics(query, candidates.length);

      const results = candidates.slice(0, limit);
      
      logger.debug('Memory recall completed', {
        query: query.substring(0, 50),
        resultsCount: results.length,
        totalCandidates: candidates.length,
      });

      return results;
    } catch (error) {
      logger.error('Failed to recall memories', { error, query: options.query });
      return [];
    }
  }

  /**
   * Forget specific memories or by criteria
   */
  async forget(
    criteria: string | { memoryIds?: string[]; contextFilter?: Partial<MemoryContext>; olderThan?: Date }
  ): Promise<number> {
    try {
      let memoriesToForget: string[] = [];

      if (typeof criteria === 'string') {
        // Single memory ID
        memoriesToForget = [criteria];
      } else {
        // Complex criteria
        if (criteria.memoryIds) {
          memoriesToForget.push(...criteria.memoryIds);
        }

        if (criteria.contextFilter || criteria.olderThan) {
          const memories = Array.from(this.memoryStore.values());
          const filtered = memories.filter(memory => {
            if (criteria.contextFilter && !this.matchesContext(memory.context, criteria.contextFilter)) {
              return false;
            }
            if (criteria.olderThan && memory.timestamp >= criteria.olderThan) {
              return false;
            }
            return true;
          });
          memoriesToForget.push(...filtered.map(m => m.id));
        }
      }

      // Remove duplicates
      memoriesToForget = [...new Set(memoriesToForget)];

      // Delete memories
      for (const memoryId of memoriesToForget) {
        const memory = this.memoryStore.get(memoryId);
        if (memory) {
          this.memoryStore.delete(memoryId);
          this.removeFromIndexes(memory);
          
          // Remove from MCP if connected
          if (this.mcpEndpoint) {
            await this.removeFromMCP(memoryId);
          }
        }
      }

      // Update analytics
      this.analytics.totalMemories = this.memoryStore.size;

      logger.info('Memories forgotten', {
        count: memoriesToForget.length,
        criteria: typeof criteria === 'string' ? 'single' : 'complex',
      });

      return memoriesToForget.length;
    } catch (error) {
      logger.error('Failed to forget memories', { error, criteria });
      return 0;
    }
  }

  /**
   * Get contextual memory summary
   */
  async getContextSummary(
    context: Partial<MemoryContext>,
    maxSummaryLength: number = 500
  ): Promise<string> {
    try {
      const memories = await this.recall({
        query: '',
        contextFilter: context,
        limit: 20,
      });

      if (memories.length === 0) {
        return 'No relevant memories found for this context.';
      }

      // Group memories by importance and recency
      const highImportance = memories.filter(m => m.importance >= 7);
      const recentMemories = memories
        .filter(m => Date.now() - m.timestamp.getTime() < 24 * 60 * 60 * 1000)
        .slice(0, 5);

      let summary = '';

      if (highImportance.length > 0) {
        summary += 'Key memories: ' + highImportance
          .map(m => m.content.substring(0, 100))
          .join('; ') + '. ';
      }

      if (recentMemories.length > 0) {
        summary += 'Recent activity: ' + recentMemories
          .map(m => m.content.substring(0, 80))
          .join('; ') + '.';
      }

      // Truncate if too long
      if (summary.length > maxSummaryLength) {
        summary = summary.substring(0, maxSummaryLength - 3) + '...';
      }

      return summary;
    } catch (error) {
      logger.error('Failed to generate context summary', { error, context });
      return 'Unable to generate memory summary.';
    }
  }

  /**
   * Get memory analytics
   */
  getAnalytics(): MemoryAnalytics {
    return { ...this.analytics };
  }

  /**
   * Export memories for backup
   */
  async exportMemories(contextFilter?: Partial<MemoryContext>): Promise<MemoryEntry[]> {
    let memories = Array.from(this.memoryStore.values());

    if (contextFilter) {
      memories = memories.filter(memory => 
        this.matchesContext(memory.context, contextFilter)
      );
    }

    return memories;
  }

  /**
   * Import memories from backup
   */
  async importMemories(memories: MemoryEntry[]): Promise<number> {
    let importedCount = 0;

    for (const memory of memories) {
      try {
        this.memoryStore.set(memory.id, memory);
        this.updateIndexes(memory);
        importedCount++;
      } catch (error) {
        logger.warn('Failed to import memory', { error, memoryId: memory.id });
      }
    }

    // Recalculate analytics
    this.recalculateAnalytics();

    logger.info('Memories imported', { count: importedCount, total: memories.length });
    return importedCount;
  }

  // Private helper methods

  private generateMemoryId(): string {
    return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async enhanceTagsWithAI(content: string, existingTags: string[]): Promise<string[]> {
    // This would integrate with your AI service to extract relevant tags
    // For now, return existing tags with some basic extraction
    const enhancedTags = [...existingTags];
    
    // Extract basic entities (this could be enhanced with NER)
    const words = content.toLowerCase().split(/\s+/);
    const commonTags = ['player', 'faction', 'mission', 'ai', 'game', 'interaction'];
    
    for (const tag of commonTags) {
      if (words.includes(tag) && !enhancedTags.includes(tag)) {
        enhancedTags.push(tag);
      }
    }

    return enhancedTags.slice(0, 10); // Limit to 10 tags
  }

  private async findRelatedMemories(content: string, context: MemoryContext): Promise<string[]> {
    const candidates = Array.from(this.memoryStore.values())
      .filter(m => m.context.contextType === context.contextType)
      .slice(0, 20);

    return this.performKeywordSearch(content, candidates)
      .slice(0, 5)
      .map(m => m.id);
  }

  private async generateEmbedding(_text: string): Promise<number[] | undefined> {
    // This would integrate with your AI service to generate embeddings
    // For now, return a mock embedding
    if (!config.features.aiCompanions) return undefined;
    
    // Mock embedding generation (replace with actual AI service call)
    const mockEmbedding = new Array(384).fill(0).map(() => Math.random() - 0.5);
    return mockEmbedding;
  }

  private calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length || vec1.length === 0) return 0;

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      const v1 = vec1[i] || 0;
      const v2 = vec2[i] || 0;
      dotProduct += v1 * v2;
      norm1 += v1 * v1;
      norm2 += v2 * v2;
    }

    if (norm1 === 0 || norm2 === 0) return 0;
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  private performKeywordSearch(query: string, candidates: MemoryEntry[]): MemoryEntry[] {
    const queryTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 2);
    
    if (queryTerms.length === 0) return candidates;

    return candidates
      .map(memory => {
        const content = memory.content.toLowerCase();
        const tags = memory.tags.map(t => t.toLowerCase());
        
        let score = 0;
        for (const term of queryTerms) {
          if (content.includes(term)) score += 2;
          if (tags.some(tag => tag.includes(term))) score += 1;
        }
        
        return { memory, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ memory }) => memory);
  }

  private matchesContext(context: MemoryContext, filter: Partial<MemoryContext>): boolean {
    return Object.entries(filter).every(([key, value]) => {
      if (key === 'metadata') {
        return this.matchesMetadata(
          context.metadata || {}, 
          typeof value === 'object' && value !== null ? value : {}
        );
      }
      return (context as any)[key] === value;
    });
  }

  private matchesMetadata(metadata: Record<string, any>, filter: Record<string, any>): boolean {
    return Object.entries(filter).every(([key, value]) => metadata[key] === value);
  }

  private updateIndexes(memory: MemoryEntry): void {
    // Update context index
    const contextKey = `${memory.context.contextType}:${memory.context.agentId}`;
    if (!this.contextIndex.has(contextKey)) {
      this.contextIndex.set(contextKey, new Set());
    }
    this.contextIndex.get(contextKey)!.add(memory.id);

    // Update tag index
    for (const tag of memory.tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(memory.id);
    }

    // Update user session tracking
    if (memory.context.userId) {
      if (!this.userSessions.has(memory.context.userId)) {
        this.userSessions.set(memory.context.userId, []);
      }
      this.userSessions.get(memory.context.userId)!.push(memory.id);
    }
  }

  private removeFromIndexes(memory: MemoryEntry): void {
    // Remove from context index
    const contextKey = `${memory.context.contextType}:${memory.context.agentId}`;
    this.contextIndex.get(contextKey)?.delete(memory.id);

    // Remove from tag index
    for (const tag of memory.tags) {
      this.tagIndex.get(tag)?.delete(memory.id);
    }

    // Remove from user sessions
    if (memory.context.userId) {
      const sessions = this.userSessions.get(memory.context.userId);
      if (sessions) {
        const index = sessions.indexOf(memory.id);
        if (index > -1) sessions.splice(index, 1);
      }
    }
  }

  private updateAnalytics(memory: MemoryEntry): void {
    this.analytics.totalMemories = this.memoryStore.size;
    
    // Update context distribution
    const contextType = memory.context.contextType;
    this.analytics.contextDistribution[contextType] = 
      (this.analytics.contextDistribution[contextType] || 0) + 1;

    // Recalculate average importance
    const allMemories = Array.from(this.memoryStore.values());
    this.analytics.averageImportance = 
      allMemories.reduce((sum, m) => sum + m.importance, 0) / allMemories.length;

    // Update top tags
    const tagCounts = new Map<string, number>();
    for (const m of allMemories) {
      for (const tag of m.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      }
    }
    
    this.analytics.topTags = Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private updateRetrievalAnalytics(query: string, _resultCount: number): void {
    const queryType = this.categorizeQuery(query);
    this.analytics.retrievalPatterns[queryType] = 
      (this.analytics.retrievalPatterns[queryType] || 0) + 1;
  }

  private categorizeQuery(query: string): string {
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('player')) return 'player_query';
    if (lowerQuery.includes('faction')) return 'faction_query';
    if (lowerQuery.includes('mission')) return 'mission_query';
    if (lowerQuery.includes('game')) return 'game_query';
    return 'general_query';
  }

  private recalculateAnalytics(): void {
    const allMemories = Array.from(this.memoryStore.values());
    
    this.analytics.totalMemories = allMemories.length;
    this.analytics.averageImportance = 
      allMemories.reduce((sum, m) => sum + m.importance, 0) / allMemories.length;

    // Recalculate context distribution
    this.analytics.contextDistribution = {};
    for (const memory of allMemories) {
      const contextType = memory.context.contextType;
      this.analytics.contextDistribution[contextType] = 
        (this.analytics.contextDistribution[contextType] || 0) + 1;
    }

    // Recalculate top tags
    const tagCounts = new Map<string, number>();
    for (const memory of allMemories) {
      for (const tag of memory.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      }
    }
    
    this.analytics.topTags = Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private async connectToMCP(): Promise<void> {
    // Implement MCP connection logic
    logger.info('Connecting to MCP server', { endpoint: this.mcpEndpoint });
  }

  private async loadPersistedMemories(): Promise<void> {
    // Implement loading from persistent storage
    logger.info('Loading persisted memories');
  }

  private async persistToMCP(memory: MemoryEntry): Promise<void> {
    // Implement MCP persistence
    logger.debug('Persisting memory to MCP', { memoryId: memory.id });
  }

  private async removeFromMCP(memoryId: string): Promise<void> {
    // Implement MCP removal
    logger.debug('Removing memory from MCP', { memoryId });
  }

  private scheduleMemoryMaintenance(): void {
    // Schedule periodic memory cleanup and optimization
    setInterval(() => {
      this.performMemoryMaintenance();
    }, 24 * 60 * 60 * 1000); // Daily
  }

  private async performMemoryMaintenance(): Promise<void> {
    logger.info('Performing memory maintenance');
    
    // Remove old, low-importance memories
    const cutoffDate = new Date(Date.now() - (config.ai.memoryRetentionDays * 24 * 60 * 60 * 1000));
    
    await this.forget({
      contextFilter: {},
      olderThan: cutoffDate,
    });

    // Optimize indexes
    this.optimizeIndexes();
    
    logger.info('Memory maintenance completed');
  }

  private optimizeIndexes(): void {
    // Clean up empty index entries
    for (const [key, set] of this.contextIndex.entries()) {
      if (set.size === 0) {
        this.contextIndex.delete(key);
      }
    }

    for (const [key, set] of this.tagIndex.entries()) {
      if (set.size === 0) {
        this.tagIndex.delete(key);
      }
    }
  }
}

// Export singleton instance
export const memoryMCP = new AdvancedMemoryMCP();
