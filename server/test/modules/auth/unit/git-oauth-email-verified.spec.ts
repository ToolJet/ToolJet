import got from 'got';
import { GitOAuthService } from '@modules/auth/oauth/util-services/git-oauth.service';

jest.mock('got');
const mockedGot = got as unknown as jest.Mock;

function jsonResponse(body: any) {
  return { json: () => body };
}

describe('GitOAuthService.signIn — GHSA-7g4q email_verified propagation', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  const configs = { clientId: 'client-id', clientSecret: 'client-secret' };

  it('treats the public profile email as verified without a second API call', async () => {
    mockedGot.mockImplementationOnce(() =>
      jsonResponse({ access_token: 'access-token', scope: 'scope', token_type: 'bearer' })
    );
    mockedGot.mockImplementationOnce(() => jsonResponse({ name: 'SSO User', email: 'ssouser@tooljet.io' }));
    const service = new GitOAuthService();

    const result = await service.signIn('some-code', configs);

    expect(result.emailVerified).toBe(true);
    expect(mockedGot).toHaveBeenCalledTimes(2);
  });

  it('reflects verified: false on the matched primary email when falling back to /user/emails', async () => {
    mockedGot.mockImplementationOnce(() =>
      jsonResponse({ access_token: 'access-token', scope: 'scope', token_type: 'bearer' })
    );
    mockedGot.mockImplementationOnce(() => jsonResponse({ name: 'SSO User', email: '' }));
    mockedGot.mockImplementationOnce(() =>
      jsonResponse([{ email: 'ssouser@tooljet.io', primary: true, verified: false }])
    );
    const service = new GitOAuthService();

    const result = await service.signIn('some-code', configs);

    expect(result.emailVerified).toBe(false);
  });

  it('reflects verified: true on the matched primary email when falling back to /user/emails', async () => {
    mockedGot.mockImplementationOnce(() =>
      jsonResponse({ access_token: 'access-token', scope: 'scope', token_type: 'bearer' })
    );
    mockedGot.mockImplementationOnce(() => jsonResponse({ name: 'SSO User', email: '' }));
    mockedGot.mockImplementationOnce(() =>
      jsonResponse([{ email: 'ssouser@tooljet.io', primary: true, verified: true }])
    );
    const service = new GitOAuthService();

    const result = await service.signIn('some-code', configs);

    expect(result.emailVerified).toBe(true);
  });
});
