import {
  SendWelcomeEmailPayload,
  SendOrganizationUserWelcomeEmailPayload,
  SendPasswordResetEmailPayload,
  SendPasswordExpiredResetEmailPayload,
  SendCommentMentionEmailPayload,
  SendEmailOtpPayload,
  SendUserBannedEmailPayload,
  SendWorkspaceBannedEmailPayload,
} from '../dto';

export enum EMAIL_EVENTS {
  SEND_WELCOME_EMAIL = 'sendWelcomeEmail',
  SEND_ORGANIZATION_USER_WELCOME_EMAIL = 'sendOrganizationUserWelcomeEmail',
  SEND_PASSWORD_RESET_EMAIL = 'sendPasswordResetEmail',
  SEND_PASSWORD_EXPIRED_RESET_EMAIL = 'sendPasswordExpiredResetEmail',
  SEND_COMMENT_MENTION_EMAIL = 'sendCommentMentionEmail',
  SEND_EMAIL_OTP = 'sendEmailOtp',
  SEND_USER_BANNED_EMAIL = 'sendUserBannedEmail',
  SEND_WORKSPACE_BANNED_EMAIL = 'sendWorkspaceBannedEmail',
}

export type EmailEventPayload =
  | { type: EMAIL_EVENTS.SEND_WELCOME_EMAIL; payload: SendWelcomeEmailPayload }
  | { type: EMAIL_EVENTS.SEND_ORGANIZATION_USER_WELCOME_EMAIL; payload: SendOrganizationUserWelcomeEmailPayload }
  | { type: EMAIL_EVENTS.SEND_PASSWORD_RESET_EMAIL; payload: SendPasswordResetEmailPayload }
  | { type: EMAIL_EVENTS.SEND_PASSWORD_EXPIRED_RESET_EMAIL; payload: SendPasswordExpiredResetEmailPayload }
  | { type: EMAIL_EVENTS.SEND_COMMENT_MENTION_EMAIL; payload: SendCommentMentionEmailPayload }
  | { type: EMAIL_EVENTS.SEND_EMAIL_OTP; payload: SendEmailOtpPayload }
  | { type: EMAIL_EVENTS.SEND_USER_BANNED_EMAIL; payload: SendUserBannedEmailPayload }
  | { type: EMAIL_EVENTS.SEND_WORKSPACE_BANNED_EMAIL; payload: SendWorkspaceBannedEmailPayload };
