// Email templates for GangGPT
export const emailTemplates = {
  welcome: (
    username: string
  ): { subject: string; html: string; text: string } => ({
    subject: `Welcome to GangGPT, ${username}!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to GangGPT</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #000000;
            color: #ffffff;
            border-radius: 8px;
            border: 1px solid #444;
          }
          .header {
            text-align: center;
            padding: 20px 0;
            border-bottom: 1px solid #444;
          }
          .header img {
            max-width: 150px;
          }
          .content {
            padding: 20px 0;
          }
          .footer {
            text-align: center;
            padding: 20px 0;
            font-size: 12px;
            color: #888;
            border-top: 1px solid #444;
          }
          .btn {
            display: inline-block;
            padding: 10px 20px;
            margin: 20px 0;
            background-color: #ff4136;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
          }
          .highlight {
            color: #ff4136;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to <span class="highlight">GangGPT</span></h1>
          </div>
          <div class="content">
            <p>Hey ${username},</p>
            <p>Welcome to <strong>GangGPT</strong>, the most immersive AI-powered GTA V multiplayer experience!</p>
            <p>Your account has been successfully created. You're now ready to explore Los Santos like never before, with AI companions, dynamic missions, and a living, breathing virtual world.</p>
            <p>Get started by logging in and exploring the dashboard:</p>
            <p style="text-align: center;">
              <a href="https://ganggpt.com/dashboard" class="btn">Enter Los Santos</a>
            </p>
            <p>Here's what you can do next:</p>
            <ul>
              <li>Create your first AI companion</li>
              <li>Join a faction or start your own</li>
              <li>Explore dynamic, AI-generated missions</li>
              <li>Connect with other players in the community</li>
            </ul>
            <p>If you have any questions or need assistance, our support team is here to help at <a href="mailto:support@ganggpt.com" style="color: #ff4136;">support@ganggpt.com</a>.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} GangGPT. All rights reserved.</p>
            <p>
              <a href="https://ganggpt.com/terms" style="color: #888; margin-right: 10px;">Terms of Service</a>
              <a href="https://ganggpt.com/privacy" style="color: #888;">Privacy Policy</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Welcome to GangGPT, ${username}!

Hey ${username},

Welcome to GangGPT, the most immersive AI-powered GTA V multiplayer experience!

Your account has been successfully created. You're now ready to explore Los Santos like never before, with AI companions, dynamic missions, and a living, breathing virtual world.

Get started by logging in and exploring the dashboard: https://ganggpt.com/dashboard

Here's what you can do next:
- Create your first AI companion
- Join a faction or start your own
- Explore dynamic, AI-generated missions
- Connect with other players in the community

If you have any questions or need assistance, our support team is here to help at support@ganggpt.com.

© ${new Date().getFullYear()} GangGPT. All rights reserved.
Terms of Service: https://ganggpt.com/terms
Privacy Policy: https://ganggpt.com/privacy`,
  }),

  passwordReset: (
    resetToken: string
  ): { subject: string; html: string; text: string } => ({
    subject: 'Reset Your GangGPT Password',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your GangGPT Password</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #000000;
            color: #ffffff;
            border-radius: 8px;
            border: 1px solid #444;
          }
          .header {
            text-align: center;
            padding: 20px 0;
            border-bottom: 1px solid #444;
          }
          .header img {
            max-width: 150px;
          }
          .content {
            padding: 20px 0;
          }
          .footer {
            text-align: center;
            padding: 20px 0;
            font-size: 12px;
            color: #888;
            border-top: 1px solid #444;
          }
          .btn {
            display: inline-block;
            padding: 10px 20px;
            margin: 20px 0;
            background-color: #ff4136;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
          }
          .highlight {
            color: #ff4136;
            font-weight: bold;
          }
          .warning {
            background-color: rgba(255, 65, 54, 0.1);
            padding: 10px;
            border-radius: 4px;
            margin: 20px 0;
            border-left: 4px solid #ff4136;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>We received a request to reset your password for your <strong>GangGPT</strong> account. If you didn't make this request, you can safely ignore this email.</p>
            <p>To reset your password, click the button below:</p>
            <p style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:4829'}/auth/reset-password?token=${resetToken}" class="btn">Reset Password</a>
            </p>
            <div class="warning">
              <p><strong>Important:</strong> This link will expire in 1 hour for security reasons.</p>
            </div>
            <p>If the button above doesn't work, copy and paste the following link into your browser:</p>
            <p style="word-break: break-all;">${process.env.FRONTEND_URL || 'http://localhost:4829'}/auth/reset-password?token=${resetToken}</p>
            <p>For security, this password reset link will expire in 1 hour. If you need a new link, you can request another password reset.</p>
            <p>If you didn't request a password reset, please contact our support team immediately at <a href="mailto:security@ganggpt.com" style="color: #ff4136;">security@ganggpt.com</a>.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} GangGPT. All rights reserved.</p>
            <p>
              <a href="https://ganggpt.com/terms" style="color: #888; margin-right: 10px;">Terms of Service</a>
              <a href="https://ganggpt.com/privacy" style="color: #888;">Privacy Policy</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Reset Your GangGPT Password

Hello,

We received a request to reset your password for your GangGPT account. If you didn't make this request, you can safely ignore this email.

To reset your password, click the link below:
${process.env.FRONTEND_URL || 'http://localhost:4829'}/auth/reset-password?token=${resetToken}

Important: This link will expire in 1 hour for security reasons.

If you didn't request a password reset, please contact our support team immediately at security@ganggpt.com.

© ${new Date().getFullYear()} GangGPT. All rights reserved.
Terms of Service: https://ganggpt.com/terms
Privacy Policy: https://ganggpt.com/privacy`,
  }),
};
