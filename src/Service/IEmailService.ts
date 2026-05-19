export interface EmailParams {
  to: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
  from?: string;
  replyTo?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface IEmailProvider {
  sendEmail(params: EmailParams): Promise<EmailResult>;
}

export interface InvitationEmailParams extends EmailParams {
  organizationName: string;
  inviterName: string;
  role: string;
  acceptUrl: string;
  expiryDays: number;
}

export interface MemberNotificationParams extends EmailParams {
  organizationName: string;
  newMemberName: string;
  newMemberEmail: string;
  newMemberRole: string;
}

export default interface IEmailService {
  sendInvitationEmail(params: InvitationEmailParams): Promise<EmailResult>;
  sendMemberNotificationEmail(params: MemberNotificationParams): Promise<EmailResult>;
  addProvider(name: string, provider: IEmailProvider): void;
  setDefaultProvider(name: string): void;
  sendEmail(params: EmailParams): Promise<EmailResult>;
}
