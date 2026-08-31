import nodemailer from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private config: EmailConfig;

  constructor() {
    this.config = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    };
  }

  private async getTransporter(): Promise<nodemailer.Transporter> {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport(this.config);

      // Verify connection configuration
      try {
        await this.transporter.verify();
        console.log('SMTP connection verified successfully');
      } catch (error) {
        console.warn('SMTP connection failed, using development mode:', error);
        // In development, we'll allow the signup to continue without email
        // The user will see the OTP in the console logs
        if (process.env.NODE_ENV === 'development') {
          console.warn('Email service is not configured properly. OTP will be logged to console.');
          return this.transporter;
        }
        throw new Error('Failed to connect to SMTP server');
      }
    }
    return this.transporter;
  }

  async sendEmail(options: SendEmailOptions): Promise<boolean> {
    try {
      const transporter = await this.getTransporter();

      const mailOptions = {
        from: `"${process.env.APP_NAME || 'App'}" <${this.config.auth.user}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  async sendOTPEmail(email: string, otp: string, userName?: string): Promise<boolean> {
    const subject = 'Verify Your Email - OTP Code';
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Email Verification</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
            <h2 style="color: #333; margin-top: 0;">Hello${userName ? ` ${userName}` : ''}!</h2>
            <p style="font-size: 16px; margin-bottom: 25px;">
              Thank you for signing up! To complete your registration, please verify your email address using the OTP code below:
            </p>
            
            <div style="background: white; padding: 25px; border-radius: 8px; text-align: center; border: 2px dashed #667eea; margin: 25px 0;">
              <h3 style="color: #667eea; margin: 0; font-size: 32px; letter-spacing: 5px; font-family: 'Courier New', monospace;">${otp}</h3>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 20px;">
              This code will expire in 10 minutes. If you didn't request this verification, please ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; color: #666; font-size: 12px;">
            <p>This is an automated message, please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} ${process.env.APP_NAME || 'App'}. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;

    const text = `
Hello${userName ? ` ${userName}` : ''}!

Thank you for signing up! To complete your registration, please verify your email address using the OTP code below:

OTP Code: ${otp}

This code will expire in 10 minutes. If you didn't request this verification, please ignore this email.

This is an automated message, please do not reply to this email.
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });
  }

  async sendPasswordResetEmail(email: string, resetToken: string, userName?: string): Promise<boolean> {
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    const subject = 'Reset Your Password';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset Request</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
            <h2 style="color: #333; margin-top: 0;">Hello${userName ? ` ${userName}` : ''}!</h2>
            <p style="font-size: 16px; margin-bottom: 25px;">
              We received a request to reset your password. Click the button below to reset your password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Reset Password
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 20px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${resetUrl}" style="color: #667eea; word-break: break-all;">${resetUrl}</a>
            </p>
            
            <p style="font-size: 14px; color: #666;">
              This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; color: #666; font-size: 12px;">
            <p>This is an automated message, please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} ${process.env.APP_NAME || 'App'}. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;

    const text = `
Hello${userName ? ` ${userName}` : ''}!

We received a request to reset your password. Click the link below to reset your password:

${resetUrl}

This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.

This is an automated message, please do not reply to this email.
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });
  }

  async sendWelcomeEmail(email: string, userName: string): Promise<boolean> {
    const subject = 'Welcome to Our Platform!';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome!</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
            <h2 style="color: #333; margin-top: 0;">Hello ${userName}!</h2>
            <p style="font-size: 16px; margin-bottom: 25px;">
              Welcome to our platform! Your email has been successfully verified and your account is now active.
            </p>
            
            <p style="font-size: 16px;">
              You can now start using all the features of our platform. If you have any questions, feel free to reach out to our support team.
            </p>
          </div>
          
          <div style="text-align: center; color: #666; font-size: 12px;">
            <p>This is an automated message, please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} ${process.env.APP_NAME || 'App'}. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
    });
  }
}

// Singleton instance
const emailService = new EmailService();

export const sendEmail = emailService.sendEmail.bind(emailService);
export default emailService;
export { EmailService };
