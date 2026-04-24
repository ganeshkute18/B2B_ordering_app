import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Email Service
 * 
 * Handles sending emails for:
 * - Email verification
 * - Password reset
 * - User invitations
 * - Order confirmations
 * - System notifications
 * 
 * In development: Logs emails to console
 * In production: Sends via email provider (configure via env vars)
 */

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly isDevelopment = process.env.NODE_ENV !== 'production';

  constructor(private configService: ConfigService) {}

  /**
   * Send email verification link
   * Used for: Customer signup, staff signup
   */
  async sendVerificationEmail(email: string, verificationToken: string): Promise<void> {
    const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/verify-email?token=${verificationToken}`;

    const subject = '✉️ Verify Your Email - Distro Platform';
    const html = `
      <h2>Welcome to Distro Platform!</h2>
      <p>Please verify your email address by clicking the link below:</p>
      <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
        Verify Email
      </a>
      <p>Or copy this link: ${verificationLink}</p>
      <p>This link will expire in 24 hours.</p>
      <hr>
      <p><small>If you didn't create this account, please ignore this email.</small></p>
    `;

    const text = `
      Welcome to Distro Platform!
      
      Please verify your email by visiting this link:
      ${verificationLink}
      
      This link will expire in 24 hours.
      
      If you didn't create this account, please ignore this email.
    `;

    await this.send({
      to: email,
      subject,
      html,
      text,
    });
  }

  /**
   * Send user approval notification
   * Used when: Owner approves a new user
   */
  async sendApprovalEmail(email: string, userName: string, approvalReason?: string): Promise<void> {
    const subject = '✅ Your Account Has Been Approved - Distro Platform';
    const html = `
      <h2>Account Approved!</h2>
      <p>Hi ${userName},</p>
      <p>Great news! Your account on Distro Platform has been approved.</p>
      ${approvalReason ? `<p><strong>Notes from admin:</strong> ${approvalReason}</p>` : ''}
      <p>You can now log in and start using the platform.</p>
      <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/login" style="display: inline-block; padding: 10px 20px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px;">
        Go to Login
      </a>
      <hr>
      <p><small>If you have any questions, please contact support.</small></p>
    `;

    const text = `
      Account Approved!
      
      Hi ${userName},
      
      Great news! Your account on Distro Platform has been approved.
      ${approvalReason ? `Notes from admin: ${approvalReason}` : ''}
      
      You can now log in and start using the platform at: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/login
    `;

    await this.send({
      to: email,
      subject,
      html,
      text,
    });
  }

  /**
   * Send user rejection notification
   * Used when: Owner rejects a new user
   */
  async sendRejectionEmail(
    email: string,
    userName: string,
    rejectionReason: string,
  ): Promise<void> {
    const subject = '❌ Account Application Status - Distro Platform';
    const html = `
      <h2>Account Application Update</h2>
      <p>Hi ${userName},</p>
      <p>Unfortunately, we are unable to approve your account at this time.</p>
      <p><strong>Reason:</strong> ${rejectionReason}</p>
      <p>If you believe this was a mistake or would like to appeal, please contact our support team.</p>
      <hr>
      <p><small>For more information, please visit our help center.</small></p>
    `;

    const text = `
      Account Application Update
      
      Hi ${userName},
      
      Unfortunately, we are unable to approve your account at this time.
      
      Reason: ${rejectionReason}
      
      If you believe this was a mistake or would like to appeal, please contact our support team.
    `;

    await this.send({
      to: email,
      subject,
      html,
      text,
    });
  }

  /**
   * Send staff invitation
   * Used when: Owner creates an invitation for staff
   */
  async sendStaffInvitation(email: string, invitationCode: string, inviterName: string): Promise<void> {
    const signupLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/signup/staff?code=${invitationCode}&email=${email}`;

    const subject = '👋 You\'re Invited to Distro Platform';
    const html = `
      <h2>You're Invited!</h2>
      <p>Hi,</p>
      <p><strong>${inviterName}</strong> has invited you to join Distro Platform as a staff member.</p>
      <a href="${signupLink}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
        Accept Invitation & Sign Up
      </a>
      <p>Or use this invitation code: <code>${invitationCode}</code></p>
      <p>This invitation will expire in 7 days.</p>
      <hr>
      <p><small>If you didn't expect this invitation, please ignore this email.</small></p>
    `;

    const text = `
      You're Invited!
      
      Hi,
      
      ${inviterName} has invited you to join Distro Platform as a staff member.
      
      Visit this link to accept and sign up:
      ${signupLink}
      
      Or use this invitation code: ${invitationCode}
      
      This invitation will expire in 7 days.
      
      If you didn't expect this invitation, please ignore this email.
    `;

    await this.send({
      to: email,
      subject,
      html,
      text,
    });
  }

  /**
   * Send order confirmation
   * Used when: Customer places an order
   */
  async sendOrderConfirmation(
    email: string,
    userName: string,
    orderId: string,
    orderTotal: number,
  ): Promise<void> {
    const subject = `📦 Order Confirmation #${orderId}`;
    const html = `
      <h2>Order Confirmed!</h2>
      <p>Hi ${userName},</p>
      <p>Thank you for your order. Here are your order details:</p>
      <p><strong>Order ID:</strong> ${orderId}</p>
      <p><strong>Total:</strong> ₹${(orderTotal / 100).toFixed(2)}</p>
      <p>You'll receive updates on your order status. Track your order <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/orders/${orderId}">here</a>.</p>
      <hr>
      <p><small>If you have any questions, please contact support.</small></p>
    `;

    const text = `
      Order Confirmed!
      
      Hi ${userName},
      
      Thank you for your order. Here are your order details:
      
      Order ID: ${orderId}
      Total: ₹${(orderTotal / 100).toFixed(2)}
      
      You'll receive updates on your order status. Track your order at: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/orders/${orderId}
    `;

    await this.send({
      to: email,
      subject,
      html,
      text,
    });
  }

  /**
   * Generic send email method
   */
  private async send(options: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<void> {
    try {
      if (this.isDevelopment) {
        // In development, log to console
        this.logger.log(
          `📧 EMAIL: To=${options.to}, Subject="${options.subject}"`,
        );
        this.logger.debug(`HTML: ${options.html}`);
      } else {
        // In production, implement real email sending
        // Options:
        // 1. SendGrid (npm install @sendgrid/mail)
        // 2. Mailgun (npm install mailgun.js)
        // 3. AWS SES (npm install @aws-sdk/client-ses)
        // 4. Nodemailer (npm install nodemailer)

        this.logger.warn(
          'Email sending not configured for production. Please implement email provider.',
        );
        this.logger.log(
          `📧 EMAIL: To=${options.to}, Subject="${options.subject}"`,
        );
      }
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}:`, error);
      throw error;
    }
  }
}
