export interface SSOResponse {
  token: string;
  state?: string;
  username?: string;
  password?: string;
  codeVerifier?: string;
  organizationId?: string;
  samlResponseId?: string;
  signupOrganizationId?: string;
  invitationToken?: string;
  redirectTo?: string;
  iss?: string;
}
