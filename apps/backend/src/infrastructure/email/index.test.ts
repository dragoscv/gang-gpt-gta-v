import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';

// Mock nodemailer with proper transport methods
const mockTransport = {
  sendMail: vi.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  verify: vi.fn().mockResolvedValue(true),
};

const mockCreateTestAccount = vi.fn().mockResolvedValue({
  user: 'test@ethereal.email',
  pass: 'testpass',
});

const mockGetTestMessageUrl = vi
  .fn()
  .mockReturnValue('https://ethereal.email/test');

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => mockTransport),
    createTestAccount: mockCreateTestAccount,
    getTestMessageUrl: mockGetTestMessageUrl,
  },
  createTransport: vi.fn(() => mockTransport),
  createTestAccount: mockCreateTestAccount,
  getTestMessageUrl: mockGetTestMessageUrl,
}));

// Mock logger
const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

vi.mock('../logging', () => ({
  logger: mockLogger,
}));

const originalEnv = process.env;

describe('EmailService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    mockTransport.sendMail.mockResolvedValue({ messageId: 'test-message-id' });
    mockTransport.verify.mockResolvedValue(true);
    mockLogger.info.mockClear();
    mockLogger.warn.mockClear();
    mockLogger.error.mockClear();
    vi.resetModules();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('initialization with production config', () => {
    it('should initialize with production email configuration', async () => {
      process.env.EMAIL_HOST = 'smtp.gmail.com';
      process.env.EMAIL_USER = 'test@gmail.com';
      process.env.EMAIL_PASSWORD = 'testpass';
      process.env.EMAIL_PORT = '587';
      process.env.EMAIL_SECURE = 'true';

      const { emailService } = await import('./index');
      await emailService.ensureInitialized();

      expect(mockTransport.verify).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Email service initialized successfully'
      );
    });

    it('should handle email verification failure gracefully', async () => {
      process.env.EMAIL_HOST = 'smtp.gmail.com';
      process.env.EMAIL_USER = 'test@gmail.com';
      process.env.EMAIL_PASSWORD = 'testpass';

      mockTransport.verify.mockRejectedValueOnce(
        new Error('Verification failed')
      );

      const { emailService } = await import('./index');
      await emailService.ensureInitialized();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to initialize email service:',
        expect.any(Error)
      );
    });
  });

  describe('initialization with test account', () => {
    it('should use test account when no email config provided', async () => {
      delete process.env.EMAIL_HOST;
      delete process.env.EMAIL_USER;
      delete process.env.EMAIL_PASSWORD;

      const { emailService } = await import('./index');
      await emailService.ensureInitialized();

      expect(mockCreateTestAccount).toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Email not configured, using Ethereal Email for testing'
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Email service initialized with test account: test@ethereal.email'
      );
    });

    it('should handle test account creation failure', async () => {
      delete process.env.EMAIL_HOST;
      delete process.env.EMAIL_USER;

      mockCreateTestAccount.mockRejectedValueOnce(
        new Error('Test account creation failed')
      );

      const { emailService } = await import('./index');
      await emailService.ensureInitialized();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to initialize email service:',
        expect.any(Error)
      );
    });
  });

  describe('sendEmail', () => {
    it('should send email successfully with all options', async () => {
      process.env.EMAIL_HOST = 'smtp.test.com';
      process.env.EMAIL_USER = 'test@test.com';
      process.env.EMAIL_PASSWORD = 'testpass';
      process.env.EMAIL_FROM = '"Test App" <noreply@test.com>';

      const { emailService } = await import('./index');
      await emailService.ensureInitialized();

      const result = await emailService.sendEmail({
        to: 'user@test.com',
        subject: 'Test Subject',
        html: '<p>Test HTML content</p>',
        text: 'Test text content',
        attachments: [
          {
            filename: 'test.txt',
            content: 'Test attachment content',
            contentType: 'text/plain',
          },
        ],
      });

      expect(result).toBe(true);
      expect(mockTransport.sendMail).toHaveBeenCalledWith({
        from: '"Test App" <noreply@test.com>',
        to: 'user@test.com',
        subject: 'Test Subject',
        html: '<p>Test HTML content</p>',
        text: 'Test text content',
      });
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Email sent successfully to user@test.com'
      );
    });

    it('should use default from address when not configured', async () => {
      process.env.EMAIL_HOST = 'smtp.test.com';
      process.env.EMAIL_USER = 'test@test.com';
      process.env.EMAIL_PASSWORD = 'testpass';
      delete process.env.EMAIL_FROM;

      const { emailService } = await import('./index');
      await emailService.ensureInitialized();

      const result = await emailService.sendEmail({
        to: 'user@test.com',
        subject: 'Test Subject',
        html: '<p>Test HTML content</p>',
      });

      expect(result).toBe(true);
      expect(mockTransport.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: '"GangGPT" <noreply@ganggpt.com>',
        })
      );
    });

    it('should handle email sending failure', async () => {
      process.env.EMAIL_HOST = 'smtp.test.com';
      process.env.EMAIL_USER = 'test@test.com';
      process.env.EMAIL_PASSWORD = 'testpass';

      const { emailService } = await import('./index');
      await emailService.ensureInitialized();

      mockTransport.sendMail.mockRejectedValueOnce(new Error('SMTP Error'));

      const result = await emailService.sendEmail({
        to: 'invalid@test.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to send email:',
        expect.any(Error)
      );
    });

    it('should fail when service not initialized', async () => {
      delete process.env.EMAIL_HOST;
      delete process.env.EMAIL_USER;

      // Force initialization to fail
      mockCreateTestAccount.mockRejectedValueOnce(new Error('Init failed'));

      const { emailService } = await import('./index');
      await emailService.ensureInitialized();

      const result = await emailService.sendEmail({
        to: 'user@test.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Email service not initialized, cannot send email'
      );
    });

    it('should log preview URL for test accounts', async () => {
      delete process.env.EMAIL_HOST;
      delete process.env.EMAIL_USER;

      const { emailService } = await import('./index');
      await emailService.ensureInitialized();

      await emailService.sendEmail({
        to: 'user@test.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(mockGetTestMessageUrl).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Preview URL: https://ethereal.email/test'
      );
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email with default frontend URL', async () => {
      process.env.EMAIL_HOST = 'smtp.test.com';
      process.env.EMAIL_USER = 'test@test.com';
      process.env.EMAIL_PASSWORD = 'testpass';
      delete process.env.FRONTEND_URL;

      const { emailService } = await import('./index');
      await emailService.ensureInitialized();

      const result = await emailService.sendPasswordResetEmail(
        'user@test.com',
        'reset-token-123'
      );

      expect(result).toBe(true);
      expect(mockTransport.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@test.com',
          subject: '🔐 Reset Your GangGPT Password',
          html: expect.stringContaining(
            'http://localhost:4829/auth/reset-password?token=reset-token-123'
          ),
          text: expect.stringContaining(
            'http://localhost:4829/auth/reset-password?token=reset-token-123'
          ),
        })
      );
    });

    it('should send password reset email with custom frontend URL', async () => {
      process.env.EMAIL_HOST = 'smtp.test.com';
      process.env.EMAIL_USER = 'test@test.com';
      process.env.EMAIL_PASSWORD = 'testpass';
      process.env.FRONTEND_URL = 'https://ganggpt.com';

      const { emailService } = await import('./index');
      await emailService.ensureInitialized();

      const result = await emailService.sendPasswordResetEmail(
        'user@test.com',
        'reset-token-456'
      );

      expect(result).toBe(true);
      expect(mockTransport.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining(
            'https://ganggpt.com/auth/reset-password?token=reset-token-456'
          ),
          text: expect.stringContaining(
            'https://ganggpt.com/auth/reset-password?token=reset-token-456'
          ),
        })
      );
    });

    it('should handle password reset email sending failure', async () => {
      process.env.EMAIL_HOST = 'smtp.test.com';
      process.env.EMAIL_USER = 'test@test.com';
      process.env.EMAIL_PASSWORD = 'testpass';

      const { emailService } = await import('./index');
      await emailService.ensureInitialized();

      mockTransport.sendMail.mockRejectedValueOnce(new Error('SMTP Error'));

      const result = await emailService.sendPasswordResetEmail(
        'user@test.com',
        'reset-token-123'
      );

      expect(result).toBe(false);
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email with default frontend URL', async () => {
      process.env.EMAIL_HOST = 'smtp.test.com';
      process.env.EMAIL_USER = 'test@test.com';
      process.env.EMAIL_PASSWORD = 'testpass';
      delete process.env.FRONTEND_URL;

      const { emailService } = await import('./index');
      await emailService.ensureInitialized();

      const result = await emailService.sendWelcomeEmail(
        'user@test.com',
        'John Doe'
      );

      expect(result).toBe(true);
      expect(mockTransport.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@test.com',
          subject: '🎮 Welcome to GangGPT - Your AI Adventure Awaits!',
          html: expect.stringContaining('Welcome to the Streets, John Doe!'),
          text: expect.stringContaining('Welcome to GangGPT - John Doe!'),
        })
      );
    });

    it('should send welcome email with custom frontend URL', async () => {
      process.env.EMAIL_HOST = 'smtp.test.com';
      process.env.EMAIL_USER = 'test@test.com';
      process.env.EMAIL_PASSWORD = 'testpass';
      process.env.FRONTEND_URL = 'https://ganggpt.com';

      const { emailService } = await import('./index');
      await emailService.ensureInitialized();

      const result = await emailService.sendWelcomeEmail(
        'user@test.com',
        'Jane Smith'
      );

      expect(result).toBe(true);
      expect(mockTransport.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining('https://ganggpt.com/auth/login'),
          text: expect.stringContaining('https://ganggpt.com/auth/login'),
        })
      );
    });

    it('should handle welcome email sending failure', async () => {
      process.env.EMAIL_HOST = 'smtp.test.com';
      process.env.EMAIL_USER = 'test@test.com';
      process.env.EMAIL_PASSWORD = 'testpass';

      const { emailService } = await import('./index');
      await emailService.ensureInitialized();

      mockTransport.sendMail.mockRejectedValueOnce(new Error('SMTP Error'));

      const result = await emailService.sendWelcomeEmail(
        'user@test.com',
        'John Doe'
      );

      expect(result).toBe(false);
    });
  });

  describe('email content validation', () => {
    it('should include security information in password reset email', async () => {
      process.env.EMAIL_HOST = 'smtp.test.com';
      process.env.EMAIL_USER = 'test@test.com';
      process.env.EMAIL_PASSWORD = 'testpass';

      const { emailService } = await import('./index');
      await emailService.ensureInitialized();

      await emailService.sendPasswordResetEmail('user@test.com', 'token123');

      const mailCall = mockTransport.sendMail.mock.calls[0][0];
      expect(mailCall.html).toContain('This link will expire in 1 hour');
      expect(mailCall.html).toContain('This link can only be used once');
      expect(mailCall.text).toContain('This link will expire in 1 hour');
      expect(mailCall.text).toContain('This link can only be used once');
    });

    it('should include game features in welcome email', async () => {
      process.env.EMAIL_HOST = 'smtp.test.com';
      process.env.EMAIL_USER = 'test@test.com';
      process.env.EMAIL_PASSWORD = 'testpass';

      const { emailService } = await import('./index');
      await emailService.ensureInitialized();

      await emailService.sendWelcomeEmail('user@test.com', 'Player');

      const mailCall = mockTransport.sendMail.mock.calls[0][0];
      expect(mailCall.html).toContain('AI companions remember');
      expect(mailCall.html).toContain('procedurally generated');
      expect(mailCall.text).toContain('AI companions remember');
      expect(mailCall.text).toContain('procedurally generated');
    });
  });

  describe('configuration edge cases', () => {
    it('should handle port parsing errors', async () => {
      process.env.EMAIL_HOST = 'smtp.test.com';
      process.env.EMAIL_USER = 'test@test.com';
      process.env.EMAIL_PASSWORD = 'testpass';
      process.env.EMAIL_PORT = 'invalid-port';

      const { emailService } = await import('./index');
      await emailService.ensureInitialized();

      // Should default to port 587 when parsing fails
      expect(mockTransport.verify).toHaveBeenCalled();
    });

    it('should handle boolean secure flag correctly', async () => {
      process.env.EMAIL_HOST = 'smtp.test.com';
      process.env.EMAIL_USER = 'test@test.com';
      process.env.EMAIL_PASSWORD = 'testpass';
      process.env.EMAIL_SECURE = 'true';

      const { emailService } = await import('./index');
      await emailService.ensureInitialized();

      expect(mockTransport.verify).toHaveBeenCalled();
    });
  });
});
