import nodemailer from 'nodemailer';
import { logger } from '../logging';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: {
    filename: string;
    content?: string | Buffer;
    path?: string;
    contentType?: string;
  }[];
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private initializationPromise: Promise<void>;

  constructor() {
    this.initializationPromise = this.initialize();
  }

  async ensureInitialized(): Promise<void> {
    await this.initializationPromise;
  }

  private async initialize(): Promise<void> {
    try {
      // Check if email is configured
      const emailConfig = {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT) : 587,
        secure: process.env.EMAIL_SECURE === 'true',
        user: process.env.EMAIL_USER,
        password: process.env.EMAIL_PASSWORD,
      };

      // If email is not configured, use a test account for development
      if (!emailConfig.host || !emailConfig.user) {
        logger.warn('Email not configured, using Ethereal Email for testing');

        // Create test account for development
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });

        logger.info(
          `Email service initialized with test account: ${testAccount.user}`
        );
        return;
      } // Use configured SMTP settings
      this.transporter = nodemailer.createTransport({
        host: emailConfig.host,
        port: emailConfig.port,
        secure: emailConfig.secure,
        auth: {
          user: emailConfig.user,
          pass: emailConfig.password,
        },
      });

      // Verify connection
      if (this.transporter) {
        await this.transporter.verify();
      }
      logger.info('Email service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
      this.transporter = null;
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    await this.ensureInitialized();

    if (!this.transporter) {
      logger.error('Email service not initialized, cannot send email');
      return false;
    }

    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || '"GangGPT" <noreply@ganggpt.com>',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      const info = await this.transporter.sendMail(mailOptions);

      // For test accounts, log the preview URL
      if (nodemailer.getTestMessageUrl(info)) {
        logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      }

      logger.info(`Email sent successfully to ${options.to}`);
      return true;
    } catch (error) {
      logger.error('Failed to send email:', error);
      return false;
    }
  }

  async sendPasswordResetEmail(
    email: string,
    resetToken: string
  ): Promise<boolean> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/auth/reset-password?token=${resetToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset - GangGPT</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎮 GangGPT</h1>
            <p style="color: #f0f0f0; margin: 10px 0 0 0; font-size: 16px;">AI-Powered Los Santos</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-top: 0;">Password Reset Request</h2>
            
            <p>Hello,</p>
            
            <p>We received a request to reset your password for your GangGPT account. If you didn't make this request, you can safely ignore this email.</p>
            
            <p>To reset your password, click the button below:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Reset Password</a>
            </div>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666; font-size: 14px;">${resetUrl}</p>
            
            <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 20px; font-size: 14px; color: #666;">
              <p><strong>Important security information:</strong></p>
              <ul>
                <li>This link will expire in 1 hour</li>
                <li>This link can only be used once</li>
                <li>If you didn't request this reset, your account is still secure</li>
              </ul>
            </div>
            
            <div style="border-top: 1px solid #eee; margin-top: 20px; padding-top: 20px; text-align: center; color: #999; font-size: 12px;">
              <p>This email was sent from GangGPT - AI-Powered Los Santos<br>
              If you have any questions, please contact our support team.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Password Reset Request - GangGPT

Hello,

We received a request to reset your password for your GangGPT account. If you didn't make this request, you can safely ignore this email.

To reset your password, visit this link:
${resetUrl}

Important security information:
- This link will expire in 1 hour
- This link can only be used once
- If you didn't request this reset, your account is still secure

If you have any questions, please contact our support team.

---
GangGPT - AI-Powered Los Santos
    `;

    return this.sendEmail({
      to: email,
      subject: '🔐 Reset Your GangGPT Password',
      html,
      text,
    });
  }

  async sendWelcomeEmail(email: string, username: string): Promise<boolean> {
    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/auth/login`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to GangGPT</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎮 Welcome to GangGPT</h1>
            <p style="color: #f0f0f0; margin: 10px 0 0 0; font-size: 16px;">AI-Powered Los Santos</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-top: 0;">Welcome to the Streets, ${username}!</h2>
            
            <p>Congratulations! Your GangGPT account has been successfully created. You're now ready to experience the most advanced AI-powered roleplay in Los Santos.</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #495057;">🚀 What's Next?</h3>
              <ul style="margin: 0;">
                <li>Complete your character creation</li>
                <li>Choose your starting faction</li>
                <li>Begin your journey in AI-powered Los Santos</li>
                <li>Interact with intelligent NPCs</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${loginUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Start Playing</a>
            </div>
            
            <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 20px; font-size: 14px; color: #666;">
              <p><strong>🎯 Pro Tips:</strong></p>
              <ul>
                <li>AI companions remember your actions and conversations</li>
                <li>Faction dynamics evolve based on collective player behavior</li>
                <li>Every mission is procedurally generated for unique experiences</li>
                <li>Build relationships for better opportunities</li>
              </ul>
            </div>
            
            <div style="border-top: 1px solid #eee; margin-top: 20px; padding-top: 20px; text-align: center; color: #999; font-size: 12px;">
              <p>Welcome to the future of roleplay gaming!<br>
              Need help? Contact our support team anytime.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Welcome to GangGPT - ${username}!

Congratulations! Your GangGPT account has been successfully created. You're now ready to experience the most advanced AI-powered roleplay in Los Santos.

What's Next:
- Complete your character creation
- Choose your starting faction  
- Begin your journey in AI-powered Los Santos
- Interact with intelligent NPCs

Start playing: ${loginUrl}

Pro Tips:
- AI companions remember your actions and conversations
- Faction dynamics evolve based on collective player behavior
- Every mission is procedurally generated for unique experiences
- Build relationships for better opportunities

Welcome to the future of roleplay gaming!
Need help? Contact our support team anytime.

---
GangGPT - AI-Powered Los Santos
    `;

    return this.sendEmail({
      to: email,
      subject: '🎮 Welcome to GangGPT - Your AI Adventure Awaits!',
      html,
      text,
    });
  }
}

// Export singleton instance
export const emailService = new EmailService();
export default emailService;
