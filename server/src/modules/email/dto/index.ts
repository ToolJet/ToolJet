export interface SendWelcomeEmailPayload {
  to: string;
  name: string;
  invitationtoken: string;
  organizationInvitationToken?: string;
  organizationId?: string;
  organizationName?: string;
  sender?: string;
  redirectTo?: string;
}

export interface SendOrganizationUserWelcomeEmailPayload {
  to: string;
  name: string;
  sender: string | null;
  invitationtoken: string;
  organizationName: string;
  organizationId: string;
  redirectTo?: string;
}

export interface SendPasswordResetEmailPayload {
  to: string;
  token: string;
  firstName?: string;
  organizationId: string;
}

export interface SendCommentMentionEmailPayload {
  to: string;
  from: string;
  appName: string;
  appLink: string;
  commentLink: string;
  timestamp: string;
  comment: string;
  fromAvatar: string;
  organizationId: string;
}
