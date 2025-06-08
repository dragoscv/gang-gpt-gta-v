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
      // Strong profanity
      /\b(fuck|fucking|shit|damn|hell)\b/i,
      // Hate content
      /\b(hate all|hate.*people|hate.*group)\b/i,
      // Violence (including kill, murder, death)
      /\b(kill|murder|death|violence)\b/i,
    ];

    this.flaggedCategories = new Map([
      [/\b(violence|kill|murder|death)\b/i, 'violence'],
      [/\b(drugs|cocaine|heroin|meth)\b/i, 'substance'],
      [/\b(steal|robbery|theft|heist)\b/i, 'crime'],
      [/\b(gang|faction|territory)\b/i, 'faction'],
      [/\b(money|cash|profit|payment)\b/i, 'economy'],
      [/\b(fuck|fucking|shit|damn|hell)\b/i, 'inappropriate'],
      [/\b(hate all|hate.*people|hate.*group)\b/i, 'hate'],
    ]);
  }

  /**
   * Filter content and return appropriateness assessment
   */
  async filterContent(content: string): Promise<ContentFilterResult> {
    try {
      const flaggedCategories: string[] = [];
      const contextualFlags: string[] = [];
      let isAppropriate = true;
      let severity: 'none' | 'low' | 'medium' | 'high' = 'none';

      // Handle empty or whitespace-only content
      if (!content || content.trim().length === 0) {
        return {
          isAppropriate: true,
          flaggedCategories: [],
          contextualFlags: [],
          severity: 'none',
          confidence: 1.0,
        };
      }

      // Check for inappropriate patterns
      for (const pattern of this.inappropriatePatterns) {
        if (pattern.test(content)) {
          isAppropriate = false;
          if (pattern.source.includes('torture|mutilate|dismember')) {
            severity = 'high';
            flaggedCategories.push('violence');
          } else if (pattern.source.includes('sexual|explicit|adult content')) {
            severity = 'high';
            flaggedCategories.push('inappropriate');
          } else if (pattern.source.includes('racial slurs|hate speech')) {
            severity = 'high';
            flaggedCategories.push('hate');
          } else if (pattern.source.includes('fuck|fucking|shit|damn|hell')) {
            severity = 'medium';
            flaggedCategories.push('inappropriate');
          } else if (
            pattern.source.includes('hate all|hate.*people|hate.*group')
          ) {
            severity = 'high';
            flaggedCategories.push('hate');
          } else if (pattern.source.includes('kill|murder|death|violence')) {
            severity = 'high';
            flaggedCategories.push('violence');
          } else {
            severity = 'medium';
            flaggedCategories.push('inappropriate');
          }
        }
      }

      // Identify content categories and contextual flags
      for (const [pattern, category] of this.flaggedCategories.entries()) {
        if (pattern.test(content)) {
          if (category === 'violence' && !isAppropriate) {
            severity = 'high';
          } else if (category === 'substance' && !isAppropriate) {
            severity = 'medium';
          }
          flaggedCategories.push(category);
          contextualFlags.push(category);
        }
      }

      // Additional contextual pattern checks
      if (/\b(crime|heist|robbery)\b/i.test(content)) {
        contextualFlags.push('crime');
      }
      if (/\b(gang|faction|territory|crew)\b/i.test(content)) {
        contextualFlags.push('faction');
      }
      if (/\b(money|cash|profit|economy|business)\b/i.test(content)) {
        contextualFlags.push('economy');
      }

      // Remove duplicates from arrays
      const uniqueFlaggedCategories = [...new Set(flaggedCategories)];
      const uniqueContextualFlags = [...new Set(contextualFlags)];

      // Calculate confidence based on content length and clarity
      const confidence = this.calculateConfidence(
        content,
        uniqueFlaggedCategories
      );

      const result: ContentFilterResult = {
        isAppropriate,
        flaggedCategories: uniqueFlaggedCategories,
        contextualFlags: uniqueContextualFlags,
        severity,
        confidence,
        suggestedAlternative: null,
      };

      // Generate alternative if inappropriate
      if (!isAppropriate) {
        result.suggestedAlternative = this.generateSafeAlternative(content);
      }

      logger.debug('Content filtered', {
        isAppropriate,
        flaggedCategories: uniqueFlaggedCategories.length,
        contextualFlags: uniqueContextualFlags.length,
        severity,
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
        contextualFlags: [],
        severity: 'high',
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
