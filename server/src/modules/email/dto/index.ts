export interface SendWelcomeEmailPayload {
  to: string;
  name: string;
  invitationtoken: string;
  organizationInvitationToken?: string;
  organizationId?: string;
  organizationName?: string;
  sender?: string;
  redirectTo?: string;
  invitationTokenExpiry?: Date | null;
}

export interface SendOrganizationUserWelcomeEmailPayload {
  to: string;
  name: string;
  sender: string | null;
  invitationtoken: string;
  organizationName: string;
  organizationId: string;
  redirectTo?: string;
  invitationTokenExpiry?: Date | null;
}

export interface SendPasswordResetEmailPayload {
  to: string;
  token: string;
  firstName?: string;
  organizationId: string;
  redirectTo?: string;
  orgSlug?: string;
  forgotPasswordTokenExpiry?: Date | null;
}

export interface SendPasswordExpiredResetEmailPayload {
  to: string;
  token: string;
  firstName?: string;
  organizationId: string;
  redirectTo?: string;
  orgSlug?: string;
}

export interface SendEmailOtpPayload {
  name: string;
  otp: string;
  email: string;
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

export interface SendAppBuildCompletedEmailPayload {
  to: string;
  name: string;
  appName: string;
  /**
   * The app's URL slug, not its name. Defaults to the app's UUID on creation and only changes if
   * someone deliberately edits it, so the link survives the rename the AI performs mid-build.
   */
  appSlug: string;
  /** Organization slug, falling back to the organization id — both resolve as the workspace segment. */
  workspaceSlug: string;
  organizationId: string;
}

export interface SendUserBannedEmailPayload {
  to: string;
  name: string;
}

export interface SendWorkspaceBannedEmailPayload {
  to: string;
  adminName: string;
  workspaceName: string;
}
