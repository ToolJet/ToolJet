import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AllExceptionsFilter } from '@modules/app/filters/all-exceptions-filter';

const SESSION_COOKIE = 'tj_auth_token=eyJ.synthetic-session-payload.synthetic-signature';
const PERSONAL_ACCESS_TOKEN = 'Bearer synthetic-personal-access-token';

function hostFor(headers: Record<string, string>, method = 'GET', url = '/api/apps/missing') {
  const response = { status: jest.fn(), json: jest.fn() };
  response.status.mockReturnValue(response);
  return {
    host: {
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => ({ method, url, headers }),
      }),
    } as any,
  };
}

describe('AllExceptionsFilter error log', () => {
  let logger: { error: jest.Mock };
  let filter: AllExceptionsFilter;

  beforeEach(() => {
    logger = { error: jest.fn() };
    filter = new AllExceptionsFilter(logger as any);
  });

  const loggedText = () => JSON.stringify(logger.error.mock.calls);

  describe('when a request with credentials fails', () => {
    it('does not write the session cookie', () => {
      const { host } = hostFor({ cookie: SESSION_COOKIE });
      filter.catch(new UnauthorizedException('Session expired'), host);
      expect(loggedText()).not.toContain('synthetic-session-payload');
    });

    it('does not write the Authorization header', () => {
      const { host } = hostFor({ authorization: PERSONAL_ACCESS_TOKEN });
      filter.catch(new UnauthorizedException('Invalid token'), host);
      expect(loggedText()).not.toContain('synthetic-personal-access-token');
    });

    it.each([
      ['x-api-key', 'synthetic-api-key'],
      ['tj-admin-api-key', 'synthetic-admin-key'],
      ['x-tooljet-delegation', 'synthetic-delegation'],
      ['proxy-authorization', 'synthetic-proxy-auth'],
      ['x-future-credential-header', 'synthetic-unknown-header-value'],
    ])('does not write the %s header', (name, value) => {
      const { host } = hostFor({ [name]: value });
      filter.catch(new NotFoundException('App not found'), host);
      expect(loggedText()).not.toContain(value);
    });
  });

  describe('when a request fails', () => {
    it('still logs the method, URL and exception message', () => {
      const { host } = hostFor({ cookie: SESSION_COOKIE }, 'POST', '/api/data-queries/abc/run');
      filter.catch(new NotFoundException('App not found'), host);

      const [entry] = logger.error.mock.calls[0];
      expect(entry).toMatchObject({ method: 'POST', url: '/api/data-queries/abc/run' });
      expect(loggedText()).toContain('App not found');
    });

    it('keeps non-sensitive diagnostic headers', () => {
      const { host } = hostFor({
        cookie: SESSION_COOKIE,
        'user-agent': 'synthetic-agent/1.0',
        'content-type': 'application/json',
      });
      filter.catch(new NotFoundException('App not found'), host);

      const [entry] = logger.error.mock.calls[0];
      expect(entry.headers).toMatchObject({ 'user-agent': 'synthetic-agent/1.0', 'content-type': 'application/json' });
    });
  });
});
