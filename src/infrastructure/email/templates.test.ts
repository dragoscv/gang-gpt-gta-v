import { describe, it, expect } from 'vitest';
import { emailTemplates } from './templates';

describe('Email Templates', () => {
  describe('welcome template', () => {
    it('should generate welcome email with username', () => {
      const username = 'TestUser';
      const result = emailTemplates.welcome(username);

      expect(result).toHaveProperty('subject');
      expect(result).toHaveProperty('html');
      expect(result).toHaveProperty('text');
      expect(result.subject).toContain(username);
      expect(result.html).toContain(username);
      expect(result.text).toContain(username);
    });

    it('should handle special characters in username', () => {
      const username = 'Test<>User&';
      const result = emailTemplates.welcome(username);

      expect(result.subject).toContain(username);
      expect(result.html).toContain('Welcome');
      expect(result.text).toContain('Welcome');
    });

    it('should have proper email structure', () => {
      const result = emailTemplates.welcome('Test');

      expect(result.html).toContain('<!DOCTYPE html>');
      expect(result.html).toContain('<html>');
      expect(result.html).toContain('GangGPT');
      expect(result.text).toBeDefined();
      expect(result.text.length).toBeGreaterThan(0);
    });
  });
  describe('passwordReset template', () => {
    it('should generate password reset email with token', () => {
      const resetToken = 'abc123xyz';
      const result = emailTemplates.passwordReset(resetToken);

      expect(result).toHaveProperty('subject');
      expect(result).toHaveProperty('html');
      expect(result).toHaveProperty('text');
      expect(result.subject).toContain('Reset');
      expect(result.html).toContain(resetToken);
      expect(result.text).toContain(resetToken);
    });

    it('should include security warnings', () => {
      const resetToken = 'security-test-token';
      const result = emailTemplates.passwordReset(resetToken);

      expect(result.html).toContain('expire in 1 hour');
      expect(result.text).toContain('expire in 1 hour');
      expect(result.html).toContain('security@ganggpt.com');
      expect(result.text).toContain('security@ganggpt.com');
    });

    it('should handle empty token', () => {
      const resetToken = '';
      const result = emailTemplates.passwordReset(resetToken);

      expect(result.subject).toBeDefined();
      expect(result.html).toBeDefined();
      expect(result.text).toBeDefined();
    });
  });
});
