import { UnauthorizedException } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { GoogleOAuthService } from '@modules/auth/oauth/util-services/google-oauth.service';

describe('GoogleOAuthService.signIn — GHSA-xfj2 audience-check bypass guard', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('rejects sign-in when the SSO config has no clientId, without verifying the token', async () => {
    const verifyIdToken = jest.spyOn(OAuth2Client.prototype, 'verifyIdToken');
    const service = new GoogleOAuthService();

    await expect(service.signIn('some-token', { clientId: undefined })).rejects.toThrow(UnauthorizedException);

    expect(verifyIdToken).not.toHaveBeenCalled();
  });

  it('still signs in normally when clientId is configured', async () => {
    const verifyIdToken = jest.spyOn(OAuth2Client.prototype, 'verifyIdToken').mockResolvedValue({
      getPayload: () => ({
        sub: 'sso-id',
        email: 'user@tooljet.io',
        name: 'SSO User',
      }),
    } as any);
    const service = new GoogleOAuthService();

    const result = await service.signIn('some-token', { clientId: 'real-client-id' });

    expect(verifyIdToken).toHaveBeenCalledWith({ idToken: 'some-token', audience: 'real-client-id' });
    expect(result).toEqual({
      userSSOId: 'sso-id',
      firstName: 'SSO',
      lastName: 'User',
      email: 'user@tooljet.io',
      emailVerified: false,
      sso: 'google',
    });
  });
});
