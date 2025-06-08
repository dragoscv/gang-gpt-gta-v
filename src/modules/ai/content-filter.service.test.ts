import { describe, it, expect, beforeEach } from 'vitest';
import { ContentFilter } from './content-filter.service';

describe('ContentFilter', () => {
  let contentFilter: ContentFilter;

  beforeEach(() => {
    contentFilter = new ContentFilter();
  });

  describe('filterContent', () => {
    it('should approve appropriate content', async () => {
      const content = 'Hello, how are you today?';
      const result = await contentFilter.filterContent(content);

      expect(result.isAppropriate).toBe(true);
      expect(result.flaggedCategories).toEqual([]);
      expect(result.severity).toBe('none');
      expect(result.suggestedAlternative).toBe(null);
    });

    it('should flag violent content', async () => {
      const content = 'I want to kill everyone in the city';
      const result = await contentFilter.filterContent(content);

      expect(result.isAppropriate).toBe(false);
      expect(result.flaggedCategories).toContain('violence');
      expect(result.severity).toBe('high');
      expect(result.suggestedAlternative).toBeTruthy();
    });

    it('should flag inappropriate language', async () => {
      const content = 'This is fucking ridiculous';
      const result = await contentFilter.filterContent(content);

      expect(result.isAppropriate).toBe(false);
      expect(result.flaggedCategories).toContain('inappropriate');
      expect(result.severity).toBe('medium');
      expect(result.suggestedAlternative).toBeTruthy();
    });

    it('should flag hate speech', async () => {
      const content = 'I hate all people from that group';
      const result = await contentFilter.filterContent(content);

      expect(result.isAppropriate).toBe(false);
      expect(result.flaggedCategories).toContain('hate');
      expect(result.severity).toBe('high');
      expect(result.suggestedAlternative).toBeTruthy();
    });

    it('should handle empty content', async () => {
      const content = '';
      const result = await contentFilter.filterContent(content);

      expect(result.isAppropriate).toBe(true);
      expect(result.flaggedCategories).toEqual([]);
      expect(result.severity).toBe('none');
    });

    it('should handle whitespace-only content', async () => {
      const content = '   \n\t  ';
      const result = await contentFilter.filterContent(content);

      expect(result.isAppropriate).toBe(true);
      expect(result.flaggedCategories).toEqual([]);
      expect(result.severity).toBe('none');
    });

    it('should detect contextual patterns', async () => {
      const content = 'Let me steal that car for the mission';
      const result = await contentFilter.filterContent(content);

      expect(result.contextualFlags).toContain('crime');
    });

    it('should detect faction-related content', async () => {
      const content = 'Our gang needs to control this territory';
      const result = await contentFilter.filterContent(content);

      expect(result.contextualFlags).toContain('faction');
    });

    it('should detect economy-related content', async () => {
      const content = 'I need to make some money quickly';
      const result = await contentFilter.filterContent(content);

      expect(result.contextualFlags).toContain('economy');
    });

    it('should handle very long content', async () => {
      const content = 'This is a very long message '.repeat(100);
      const result = await contentFilter.filterContent(content);

      expect(result.isAppropriate).toBe(true);
      expect(typeof result.severity).toBe('string');
    });

    it('should be case insensitive', async () => {
      const content = 'FUCK this game';
      const result = await contentFilter.filterContent(content);

      expect(result.isAppropriate).toBe(false);
      expect(result.flaggedCategories).toContain('inappropriate');
    });

    it('should handle special characters', async () => {
      const content = 'This is @#$%^&*() weird text';
      const result = await contentFilter.filterContent(content);

      expect(result.isAppropriate).toBe(true);
      expect(result.flaggedCategories).toEqual([]);
    });

    it('should provide appropriate alternatives for flagged content', async () => {
      const content = 'This fucking sucks';
      const result = await contentFilter.filterContent(content);

      expect(result.isAppropriate).toBe(false);
      expect(result.suggestedAlternative).toBeTruthy();
      expect(result.suggestedAlternative).not.toContain('fuck');
    });
  });
});
