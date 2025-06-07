import { logger } from '@/infrastructure/logging';
import type { ContentFilterResult } from '@/shared/types/ai';

/**
 * Content filtering service for AI-generated content
 * Ensures appropriate content in the game environment
 */
export class ContentFilter {
  private inappropriatePatterns: RegExp[];
  private flaggedCategories: Map<RegExp, string>;

  constructor() {
    this.inappropriatePatterns = [
      // Extreme violence beyond game context
      /\b(torture|mutilate|dismember|graphic violence)\b/i,
      // Sexual content
      /\b(sexual|explicit|adult content|nsfw)\b/i,
      // Real-world hate speech
      /\b(racial slurs|hate speech|discriminatory)\b/i,
      // Personal information
      /\b(real names|addresses|phone numbers|social security)\b/i,
      // External references
      /\b(real companies|real people|current events)\b/i,
    ];

    this.flaggedCategories = new Map([
      [/\b(violence|kill|murder|death)\b/i, 'violence'],
      [/\b(drugs|cocaine|heroin|meth)\b/i, 'substance'],
      [/\b(steal|robbery|theft|heist)\b/i, 'crime'],
      [/\b(gang|faction|territory)\b/i, 'faction'],
      [/\b(money|cash|profit|payment)\b/i, 'economy'],
    ]);
  }

  /**
   * Filter content and return appropriateness assessment
   */
  async filterContent(content: string): Promise<ContentFilterResult> {
    try {
      const flaggedCategories: string[] = [];
      let isAppropriate = true;

      // Check for inappropriate patterns
      for (const pattern of this.inappropriatePatterns) {
        if (pattern.test(content)) {
          isAppropriate = false;
          break;
        }
      }

      // Identify content categories
      for (const [pattern, category] of this.flaggedCategories.entries()) {
        if (pattern.test(content)) {
          flaggedCategories.push(category);
        }
      }

      // Calculate confidence based on content length and clarity
      const confidence = this.calculateConfidence(content, flaggedCategories);

      const result: ContentFilterResult = {
        isAppropriate,
        flaggedCategories,
        confidence,
      };

      // Generate alternative if inappropriate
      if (!isAppropriate) {
        result.suggestedAlternative = this.generateSafeAlternative(content);
      }

      logger.debug('Content filtered', {
        isAppropriate,
        flaggedCategories: flaggedCategories.length,
        confidence,
      });

      return result;
    } catch (error) {
      logger.error('Content filtering failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Default to safe response on error
      return {
        isAppropriate: false,
        flaggedCategories: ['error'],
        confidence: 0,
        suggestedAlternative:
          'I need to think about my response more carefully.',
      };
    }
  }

  /**
   * Calculate confidence score based on content analysis
   */
  private calculateConfidence(content: string, categories: string[]): number {
    let confidence = 0.5; // Base confidence

    // Increase confidence for appropriate length
    if (content.length > 20 && content.length < 500) {
      confidence += 0.2;
    }

    // Increase confidence for game-appropriate categories
    const gameCategories = ['faction', 'crime', 'economy'];
    const gameRelevantCategories = categories.filter(cat =>
      gameCategories.includes(cat)
    );
    confidence += gameRelevantCategories.length * 0.1;

    // Decrease confidence for concerning categories
    const concerningCategories = ['violence', 'substance'];
    const concerningFound = categories.filter(cat =>
      concerningCategories.includes(cat)
    );
    confidence -= concerningFound.length * 0.15;

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Generate safe alternative content
   */
  private generateSafeAlternative(_originalContent: string): string {
    const safeAlternatives = [
      'Let me rephrase that in a more appropriate way...',
      'I should choose my words more carefully here.',
      "Perhaps there's a better way to express this.",
      'Let me think of a more suitable response.',
      'I need to be more mindful of what I say.',
    ];

    return (
      safeAlternatives[Math.floor(Math.random() * safeAlternatives.length)] ||
      'I need to think more carefully about my response.'
    );
  }

  /**
   * Check if content needs review by human moderators
   */
  needsHumanReview(filterResult: ContentFilterResult): boolean {
    return (
      !filterResult.isAppropriate ||
      filterResult.confidence < 0.3 ||
      filterResult.flaggedCategories.includes('error')
    );
  }
}
