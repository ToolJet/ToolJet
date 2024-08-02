export type JWTPayload = {
  sessionId: string;
  username: string;
  sub: string;
  organizationId?: string;
  organizationIds?: Array<string>;
  isPasswordLogin: boolean;
  isSSOLogin: boolean;
  invitedOrganizationId?: string;
};
