import { OAuth2Client } from 'google-auth-library';
import { GoogleOAuthService } from '@modules/auth/oauth/util-services/google-oauth.service';

describe('GoogleOAuthService.signIn — GHSA-7g4q email_verified propagation', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('carries emailVerified: false through when Google reports the email unverified', async () => {
    jest.spyOn(OAuth2Client.prototype, 'verifyIdToken').mockResolvedValue({
      getPayload: () => ({
        sub: 'sso-id',
        email: 'user@tooljet.io',
        email_verified: false,
        name: 'SSO User',
      }),
    } as any);
    const service = new GoogleOAuthService();

    const result = await service.signIn('some-token', { clientId: 'real-client-id' });

    expect(result.emailVerified).toBe(false);
  });

  it('carries emailVerified: true through when Google reports the email verified', async () => {
    jest.spyOn(OAuth2Client.prototype, 'verifyIdToken').mockResolvedValue({
      getPayload: () => ({
        sub: 'sso-id',
        email: 'user@tooljet.io',
        email_verified: true,
        name: 'SSO User',
      }),
    } as any);
    const service = new GoogleOAuthService();

    const result = await service.signIn('some-token', { clientId: 'real-client-id' });

    expect(result.emailVerified).toBe(true);
  });
});
