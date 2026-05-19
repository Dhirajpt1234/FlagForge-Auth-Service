import type IEmailService from '../IEmailService';
import type { IEmailProvider, EmailParams, EmailResult, InvitationEmailParams, MemberNotificationParams } from '../IEmailService';

// TODO: Add email providers in future.
export default class EmailService implements IEmailService {
  private providers: Map<string, IEmailProvider> = new Map();
  private defaultProvider: string = 'console';

  addProvider(name: string, provider: IEmailProvider): void {
    this.providers.set(name, provider);
  }

  setDefaultProvider(name: string): void {
    if (!this.providers.has(name)) {
      throw new Error(`Email provider '${name}' not found`);
    }
    this.defaultProvider = name;
  }

  async sendEmail(params: EmailParams): Promise<EmailResult> {
    const provider = this.providers.get(this.defaultProvider);
    if (!provider) {
      return {
        success: false,
        error: `No email provider configured for '${this.defaultProvider}'`
      };
    }

    try {
      return await provider.sendEmail(params);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error sending email'
      };
    }
  }

  // TODO : take out email content from this code and clean it.
  async sendInvitationEmail(params: InvitationEmailParams): Promise<EmailResult> {
    const { organizationName, inviterName, role, acceptUrl, expiryDays, ...emailParams } = params;
    
    const subject = `You're invited to join ${organizationName}`;
    
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invitation to join ${organizationName}</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
          <h2 style="color: #333; margin-bottom: 20px;">You're Invited to Join ${organizationName}</h2>
          
          <p style="color: #666; line-height: 1.6;">
            <strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong> 
            as a <strong>${role}</strong>.
          </p>
          
          <div style="background-color: #fff; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Organization Details:</h3>
            <ul style="color: #666; line-height: 1.6;">
              <li><strong>Role:</strong> ${role}</li>
              <li><strong>Invitation expires in:</strong> ${expiryDays} days</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${acceptUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;
                      font-weight: bold;">
              Accept Invitation
            </a>
          </div>
          
          <p style="color: #999; font-size: 14px; text-align: center; margin-top: 30px;">
            If you didn't expect this invitation, you can safely ignore this email.
            <br>This invitation will expire in ${expiryDays} days.
          </p>
        </div>
      </body>
      </html>
    `;
    
    const textBody = `
      You're invited to join ${organizationName}
      
      ${inviterName} has invited you to join ${organizationName} as a ${role}.
      
      Organization Details:
      - Role: ${role}
      - Invitation expires in: ${expiryDays} days
      
      Accept your invitation here: ${acceptUrl}
      
      If you didn't expect this invitation, you can safely ignore this email.
      This invitation will expire in ${expiryDays} days.
    `;

    return this.sendEmail({
      ...emailParams,
      subject,
      htmlBody,
      textBody,
    });
  }

  async sendMemberNotificationEmail(params: MemberNotificationParams): Promise<EmailResult> {
    const { organizationName, newMemberName, newMemberEmail, newMemberRole, ...emailParams } = params;
    
    const subject = `New Member Joined ${organizationName}`;
    
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Member Notification</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
          <h2 style="color: #333; margin-bottom: 20px;">New Member Joined ${organizationName}</h2>
          
          <p style="color: #666; line-height: 1.6;">
            A new member has joined your organization!
          </p>
          
          <div style="background-color: #fff; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">New Member Details:</h3>
            <ul style="color: #666; line-height: 1.6;">
              <li><strong>Name:</strong> ${newMemberName}</li>
              <li><strong>Email:</strong> ${newMemberEmail}</li>
              <li><strong>Role:</strong> ${newMemberRole}</li>
            </ul>
          </div>
          
          <p style="color: #999; font-size: 14px; text-align: center; margin-top: 30px;">
            This is an automated notification from ${organizationName}.
          </p>
        </div>
      </body>
      </html>
    `;
    
    const textBody = `
      New Member Joined ${organizationName}
      
      A new member has joined your organization!
      
      New Member Details:
      - Name: ${newMemberName}
      - Email: ${newMemberEmail}
      - Role: ${newMemberRole}
      
      This is an automated notification from ${organizationName}.
    `;

    return this.sendEmail({
      ...emailParams,
      subject,
      htmlBody,
      textBody,
    });
  }
}

export class ConsoleEmailProvider implements IEmailProvider {
  async sendEmail(params: EmailParams): Promise<EmailResult> {
    console.log('=== EMAIL SENT ===');
    console.log('To:', params.to);
    console.log('Subject:', params.subject);
    console.log('From:', params.from || 'noreply@flagforge.com');
    console.log('HTML Body:', params.htmlBody);
    console.log('Text Body:', params.textBody);
    console.log('================');
    
    return {
      success: true,
      messageId: `console-${Date.now()}`
    };
  }
}
