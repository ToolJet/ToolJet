/** @group platform */
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { scrubSecrets, scrubSecretsIn } from '@helpers/secret-scrub.helper';
import { AllExceptionsFilter } from '@modules/app/filters/all-exceptions-filter';

// Fake tokens, assembled at run time so secret scanners don't flag the source.
const fakeToken = (prefix: string, body: string) => [prefix, body].join('');
const GITHUB_TOKEN = fakeToken('ghs_', '16C7e42F292c6912E7710c838347Ae178B4a');
const GITLAB_TOKEN = fakeToken('glpat-', 'AbCdEf1234567890xyzW');
const GITHUB_PAT = fakeToken('github_pat_', '11ABCDEFG0123456789_abcdefghijklmnop');

describe('scrubSecrets', () => {
  it.each([
    [
      'GitHub installation token in a clone URL',
      `https://x-access-token:${GITHUB_TOKEN}@github.com/acme/r.git`,
      GITHUB_TOKEN,
    ],
    ['GitLab token in a clone URL', `https://oauth2:${GITLAB_TOKEN}@gitlab.com/acme/r.git`, GITLAB_TOKEN],
    ['bare GitLab token', `token ${GITLAB_TOKEN} expired`, GITLAB_TOKEN],
    ['GitLab PRIVATE-TOKEN header', 'PRIVATE-TOKEN: Zx9yW8vU7tS6rQ5p rejected', 'Zx9yW8vU7tS6rQ5p'],
    ['token-only URL userinfo', `https://${GITHUB_TOKEN}@github.com/acme/r.git`, GITHUB_TOKEN],
    ['bare GitHub token', `using ${GITHUB_TOKEN}`, GITHUB_TOKEN],
    ['fine-grained GitHub PAT', GITHUB_PAT, GITHUB_PAT],
    ['bearer header', `Authorization: Bearer ${GITHUB_TOKEN}`, GITHUB_TOKEN],
    [
      'PEM key',
      fakeToken('-----BEGIN RSA PRIVATE', ' KEY-----\nMIIEpAIBAAKCAQEA\n-----END RSA PRIVATE KEY-----'),
      'MIIEpAIBAAKCAQEA',
    ],
  ])('should remove a %s', (_label, text, secret) => {
    const scrubbed = scrubSecrets(text);
    expect(scrubbed).not.toContain(secret);
    expect(scrubbed).toContain('[REDACTED]');
  });

  it('should keep the rest of the message readable', () => {
    expect(
      scrubSecrets(`fatal: Authentication failed for 'https://x-access-token:${GITHUB_TOKEN}@github.com/acme/r.git/'`)
    ).toBe("fatal: Authentication failed for 'https://x-access-token:[REDACTED]@github.com/acme/r.git/'");
    expect(scrubSecrets('Page not found')).toBe('Page not found');
  });

  it('should scrub each message in a list and leave other values alone', () => {
    expect(scrubSecretsIn([`a ${GITLAB_TOKEN}`, 'b'])).toEqual(['a [REDACTED]', 'b']);
    expect(scrubSecretsIn({ x: 1 })).toEqual({ x: 1 });
  });
});

describe('AllExceptionsFilter | error responses', () => {
  const filter = new AllExceptionsFilter({ error: jest.fn() } as never);
  const respond = (exception: unknown) => {
    const response = { status: jest.fn(), json: jest.fn() };
    response.status.mockReturnValue(response);
    filter.catch(exception, {
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => ({ method: 'POST', url: '/api/app-git/gitpull/app/1', headers: {} }),
      }),
    } as never);
    return response.json.mock.calls[0][0];
  };

  it('should never send a git token to the client', () => {
    const body = respond(
      new BadRequestException(
        `Error while pulling changes due to fatal: Authentication failed for 'https://x-access-token:${GITHUB_TOKEN}@github.com/acme/r.git/'`
      )
    );
    expect(body.message).not.toContain(GITHUB_TOKEN);
    expect(body).toMatchObject({ statusCode: 400, message: expect.stringContaining('Authentication failed') });
  });

  it('should scrub unexpected errors too', () => {
    const body = respond(new InternalServerErrorException(`Workspace push failed: token ${GITLAB_TOKEN} rejected`));
    expect(body.message).toBe('Workspace push failed: token [REDACTED] rejected');
  });
});
