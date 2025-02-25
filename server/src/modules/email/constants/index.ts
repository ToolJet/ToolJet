import {
  SendWelcomeEmailPayload,
  SendOrganizationUserWelcomeEmailPayload,
  SendPasswordResetEmailPayload,
  SendCommentMentionEmailPayload,
} from '../dto';

export enum EMAIL_EVENTS {
  SEND_WELCOME_EMAIL = 'sendWelcomeEmail',
  SEND_ORGANIZATION_USER_WELCOME_EMAIL = 'sendOrganizationUserWelcomeEmail',
  SEND_PASSWORD_RESET_EMAIL = 'sendPasswordResetEmail',
  SEND_COMMENT_MENTION_EMAIL = 'sendCommentMentionEmail',
}

export type EmailEventPayload =
  | { type: EMAIL_EVENTS.SEND_WELCOME_EMAIL; payload: SendWelcomeEmailPayload }
  | { type: EMAIL_EVENTS.SEND_ORGANIZATION_USER_WELCOME_EMAIL; payload: SendOrganizationUserWelcomeEmailPayload }
  | { type: EMAIL_EVENTS.SEND_PASSWORD_RESET_EMAIL; payload: SendPasswordResetEmailPayload }
  | { type: EMAIL_EVENTS.SEND_COMMENT_MENTION_EMAIL; payload: SendCommentMentionEmailPayload };
