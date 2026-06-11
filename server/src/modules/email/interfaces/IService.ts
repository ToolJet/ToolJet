import {
  SendWelcomeEmailPayload,
  SendCommentMentionEmailPayload,
  SendOrganizationUserWelcomeEmailPayload,
  SendPasswordResetEmailPayload,
} from '../dto';

export interface IEmailService {
  mailTransport(smtp: any): any;
  sendEmail(to: string, subject: string, templateData: any): Promise<any>;
  sendWelcomeEmail(payload: SendWelcomeEmailPayload): Promise<any>;
  sendOrganizationUserWelcomeEmail(payload: SendOrganizationUserWelcomeEmailPayload): Promise<any>;
  sendPasswordResetEmail(payload: SendPasswordResetEmailPayload): Promise<any>;
  sendCommentMentionEmail(payload: SendCommentMentionEmailPayload): Promise<any>;
  init(): Promise<void>;
}
